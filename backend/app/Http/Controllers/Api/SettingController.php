<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\RecordsAdminActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    use RecordsAdminActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $settings = Cache::remember('settings:all', now()->addMinutes(5), function () {
            return Setting::pluck('value', 'key');
        });

        return response()->json(['data' => $settings]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        abort(405);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        abort(405);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $normalizedKey = (string) preg_replace('/[^a-z0-9_]/i', '', $key);
        if ($normalizedKey === '' || mb_strlen($normalizedKey) > 100) {
            return response()->json([
                'message' => 'The setting key format is invalid.',
                'errors' => ['key' => ['Setting key must be alphanumeric.']],
            ], 422);
        }

        $validated = $request->validate([
            'value' => ['required', 'string', 'max:5000'],
        ]);

        $previous = Setting::where('key', $normalizedKey)->first();
        $before = $previous?->value;

        $safeValue = $this->sanitizeSettingValue((string) $validated['value'], 5000);

        $setting = Setting::updateOrCreate(
            ['key' => $normalizedKey],
            ['value' => $safeValue]
        );

        Cache::forget('settings:all');

        $this->recordActivity('setting.updated', Setting::class, $setting->key ?? $normalizedKey, [
            'key' => $normalizedKey,
            'before' => $before,
            'after' => $setting->value,
        ]);

        return response()->json(['data' => $setting]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        abort(405);
    }

    protected function sanitizeSettingValue(string $input, int $maxLength): string
    {
        $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $input) ?? '';

        return mb_substr($stripped, 0, $maxLength, 'UTF-8');
    }
}
