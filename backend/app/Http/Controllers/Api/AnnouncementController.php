<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $announcements = Cache::remember('announcements:active', now()->addMinutes(5), function () {
            return Announcement::where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });

        return response()->json(['data' => $announcements]);
    }

    /**
     * Display all announcements for the admin workspace.
     */
    public function adminIndex(): JsonResponse
    {
        return response()->json(['data' => Announcement::orderBy('sort_order')->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $announcement = Announcement::create($request->validate([
            'message' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]));

        Cache::forget('announcements:active');

        return response()->json(['data' => $announcement], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Announcement::findOrFail($id)]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->update($request->validate([
            'message' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]));

        Cache::forget('announcements:active');

        return response()->json(['data' => $announcement->refresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        Announcement::findOrFail($id)->delete();

        Cache::forget('announcements:active');

        return response()->json(['message' => 'Announcement deleted']);
    }
}
