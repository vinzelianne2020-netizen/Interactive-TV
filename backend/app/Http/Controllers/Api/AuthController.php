<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\RecordsAdminActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use RecordsAdminActivity;

    final public const MAX_LOGIN_ATTEMPTS = 5;
    final public const LOGIN_DECAY_SECONDS = 90;

    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Not authenticated.'], 401);
        }

        if (! $user->isAdmin()) {
            return response()->json(['message' => 'Account lacks administrative access.'], 403);
        }

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            ],
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $throttleKey = $this->throttleKey($request, (string) $validated['email']);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            $availableIn = RateLimiter::availableIn($throttleKey);

            $this->recordActivity('auth.login_throttled', User::class, null, [
                'email' => (string) $validated['email'],
                'retry_after_seconds' => $availableIn,
            ]);

            throw ValidationException::withMessages([
                'email' => [
                    sprintf('Too many login attempts. Try again in %d seconds.', $availableIn),
                ],
            ])->status(429);
        }

        $credentials = [
            'email' => (string) $validated['email'],
            'password' => (string) $validated['password'],
        ];

        if (! Auth::guard('web')->attempt($credentials, false)) {
            RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

            $this->recordActivity('auth.login_failed', User::class, null, [
                'email' => (string) $validated['email'],
            ]);

            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        /** @var User $user */
        $user = Auth::guard('web')->user();

        if (! $user->isAdmin()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            RateLimiter::hit($throttleKey, self::LOGIN_DECAY_SECONDS);

            $this->recordActivity('auth.login_rejected_non_admin', $user, $user->id);

            throw ValidationException::withMessages([
                'email' => ['This account is not authorized for administrative access.'],
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();
        $accessToken = $user->createToken('admin-web')->plainTextToken;

        $this->recordActivity('auth.login_succeeded', $user, $user->id);

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'token' => $accessToken,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        if ($user) {
            $this->recordActivity('auth.logout_succeeded', $user, $user->id);
            $user->currentAccessToken()?->delete();
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    protected function throttleKey(Request $request, string $email): string
    {
        return Str::transliterate(Str::lower($email).'|'.(string) $request->ip());
    }
}
