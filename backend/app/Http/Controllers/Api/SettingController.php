<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
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
        $setting = Setting::updateOrCreate(
            ['key' => $key],
            $request->validate([
                'value' => ['required', 'string'],
            ])
        );

        Cache::forget('settings:all');

        return response()->json(['data' => $setting]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        abort(405);
    }
}
