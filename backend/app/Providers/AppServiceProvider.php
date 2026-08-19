<?php

namespace App\Providers;

use App\Http\Controllers\Api\AuthController;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('auth.login', function (Request $request) {
            return Limit::perMinutes(2, AuthController::MAX_LOGIN_ATTEMPTS)
                ->by(sha1(($request->input('email') ?? '').'|'.($request->ip() ?? '')));
        });
    }
}
