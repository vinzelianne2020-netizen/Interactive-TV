<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\RecordsAdminActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class SettingController extends Controller
{
    use RecordsAdminActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $settings = Cache::remember('settings:all', now()->addMinutes(5), function () {
            return Setting::pluck('value', 'key')->all();
        });

        return response()->json(['data' => $settings]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/', 'unique:settings,key'],
            'value' => ['required', 'string', 'max:5000'],
        ]);

        return $this->saveSetting($validated['key'], $validated['value'], 'setting.created', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Setting::where('key', $id)->firstOrFail()]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $normalizedKey = strtolower($key);
        if (! preg_match('/^[a-z0-9_]{1,100}$/', $normalizedKey)) {
            return response()->json([
                'message' => 'The setting key format is invalid.',
                'errors' => ['key' => ['Setting key must be alphanumeric.']],
            ], 422);
        }

        $validated = $request->validate([
            'value' => ['required', 'string', 'max:5000'],
        ]);

        return $this->saveSetting($normalizedKey, $validated['value'], 'setting.updated');
    }

    public function uploadActivityCalendar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'calendar' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
        ]);

        $directory = public_path('uploads/activity-calendar');
        File::ensureDirectoryExists($directory);
        File::cleanDirectory($directory);

        $file = $validated['calendar'];
        $filename = 'activity-calendar.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);
        $url = '/uploads/activity-calendar/' . $filename;

        Setting::updateOrCreate(['key' => 'activity_calendar_url'], ['value' => $url]);
        Cache::forget('settings:all');

        $this->recordActivity('activity_calendar.updated', Setting::class, 'activity_calendar_url');

        return response()->json(['data' => ['key' => 'activity_calendar_url', 'value' => $url]]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $setting = Setting::where('key', $id)->firstOrFail();
        $setting->delete();
        Cache::forget('settings:all');
        $this->recordActivity('setting.deleted', Setting::class, $id);

        return response()->json(['message' => 'Setting deleted.']);
    }

    protected function saveSetting(string $key, string $value, string $action, int $status = 200): JsonResponse
    {
        $setting = Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $this->sanitizeSettingValue($value, 5000)]
        );
        Cache::forget('settings:all');
        $this->recordActivity($action, Setting::class, $key, ['key' => $key]);

        return response()->json(['data' => $setting], $status);
    }

    protected function sanitizeSettingValue(string $input, int $maxLength): string
    {
        $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $input) ?? '';

        return mb_substr($stripped, 0, $maxLength, 'UTF-8');
    }
}
