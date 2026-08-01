<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class WeatherController extends Controller
{
    public function current(): JsonResponse
    {
        $weather = Cache::remember('weather:current', now()->addMinutes(15), function () {
            $response = Http::timeout(5)->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => config('services.weather.lat'),
                'longitude' => config('services.weather.lon'),
                'current' => 'temperature_2m,weather_code',
            ]);

            $data = $response->json();

            return [
                'temp_c' => data_get($data, 'current.temperature_2m'),
                'city' => config('services.weather.city'),
                'condition_code' => data_get($data, 'current.weather_code'),
            ];
        });

        return response()->json(['data' => $weather]);
    }
}
