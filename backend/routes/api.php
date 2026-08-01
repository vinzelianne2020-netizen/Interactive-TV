<?php

use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\MetricController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\WeatherController;
use Illuminate\Support\Facades\Route;

Route::get('/events', [EventController::class, 'index']);
Route::get('/metrics', [MetricController::class, 'index']);
Route::get('/announcements', [AnnouncementController::class, 'index']);
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/weather', [WeatherController::class, 'current']);
Route::get('/clock', fn () => response()->json([
    'now' => now()->toIso8601String(),
    'timezone' => config('app.timezone'),
]));

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/admin/events', [EventController::class, 'adminIndex']);
    Route::apiResource('/admin/events', EventController::class)->except(['index']);
    Route::get('/admin/metrics', [MetricController::class, 'adminIndex']);
    Route::apiResource('/admin/metrics', MetricController::class)->except(['index']);
    Route::get('/admin/announcements', [AnnouncementController::class, 'adminIndex']);
    Route::apiResource('/admin/announcements', AnnouncementController::class)->except(['index']);
    Route::put('/admin/settings/{key}', [SettingController::class, 'update']);
});
