<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        $middleware->trustProxies(
            at: env('TRUSTED_PROXIES') === '*' ? '*' : array_filter(array_map('trim', explode(',', env('TRUSTED_PROXIES', ''))))
        );

        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                if ($e instanceof ValidationException) {
                    $status = 422;
                }

                $payload = [
                    'message' => match (true) {
                        $e instanceof ValidationException => $e->getMessage() ?: 'The given data was invalid.',
                        ($status >= 400 && $status < 500) => $e->getMessage() ?: 'Bad request.',
                        default => 'Server error. Please try again later.',
                    },
                ];

                if ($e instanceof ValidationException) {
                    $payload['errors'] = $e->errors();
                }

                if (env('APP_DEBUG', false) && !($e instanceof ValidationException)) {
                    $payload['debug'] = [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ];
                }

                return response()->json($payload, $status);
            }

            return null;
        });
    })->create();
