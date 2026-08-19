<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Support\RecordsAdminActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    use RecordsAdminActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $announcements = Cache::remember('announcements:active', now()->addMinutes(5), function () {
            return Announcement::where('is_active', true)
                ->orderBy('sort_order')
                ->limit(50)
                ->get()
                ->all();
        });

        return response()->json(['data' => $announcements]);
    }

    /**
     * Display all announcements for the admin workspace.
     */
    public function adminIndex(): JsonResponse
    {
        return response()->json(['data' => Announcement::orderBy('sort_order')->limit(500)->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatedPayload($request);
        $announcement = Announcement::create($payload);
        Cache::forget('announcements:active');

        $this->recordActivity('announcement.created', $announcement, $announcement->id, [
            'is_active' => (bool) $announcement->is_active,
        ]);

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
        $before = [
            'is_active' => (bool) $announcement->is_active,
            'sort_order' => (int) $announcement->sort_order,
        ];

        $payload = $this->validatedPayload($request);
        $announcement->update($payload);
        Cache::forget('announcements:active');

        $this->recordActivity('announcement.updated', $announcement, $announcement->id, [
            'before' => $before,
            'after' => [
                'is_active' => (bool) $announcement->is_active,
                'sort_order' => (int) $announcement->sort_order,
            ],
        ]);

        return response()->json(['data' => $announcement->refresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);
        $snapshot = ['id' => $announcement->id, 'sort_order' => (int) $announcement->sort_order];
        $announcement->delete();
        Cache::forget('announcements:active');

        $this->recordActivity('announcement.deleted', Announcement::class, $snapshot['id'], [
            'snapshot' => $snapshot,
        ]);

        return response()->json(['message' => 'Announcement deleted.']);
    }

    /**
     * @return array{message:string,is_active:bool,sort_order:int}
     */
    protected function validatedPayload(Request $request, ?Announcement $announcement = null): array
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
        ]);

        return [
            'message' => $this->sanitizePlainText((string) $validated['message'], 1000),
            'is_active' => isset($validated['is_active']) ? (bool) $validated['is_active'] : (bool) ($announcement?->is_active ?? true),
            'sort_order' => isset($validated['sort_order']) ? (int) $validated['sort_order'] : (int) ($announcement?->sort_order ?? 0),
        ];
    }

    protected function sanitizePlainText(string $input, int $maxLength): string
    {
        $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $input) ?? '';
        $trimmed = trim(preg_replace('/\s+/u', ' ', $stripped) ?? '');

        return mb_substr($trimmed, 0, $maxLength, 'UTF-8');
    }
}
