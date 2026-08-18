<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\RecordsAdminActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    use RecordsAdminActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $events = Event::where('is_published', true)
            ->orderByRaw("event_date >= ? desc", [now()->toDateString()])
            ->orderBy('event_date')
            ->orderBy('sort_order')
            ->limit(50)
            ->get()
            ->map(fn (Event $event) => $this->formatEvent($event));

        return response()->json(['data' => $events]);
    }

    /**
     * Display all events for the admin workspace.
     */
    public function adminIndex(): JsonResponse
    {
        $events = Event::orderByDesc('event_date')
            ->orderBy('sort_order')
            ->limit(200)
            ->get()
            ->map(fn (Event $event) => $this->formatEvent($event));

        return response()->json(['data' => $events]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatedPayload($request);
        $event = Event::create($payload);

        $this->recordActivity('event.created', $event, $event->id, [
            'title' => $event->title,
            'event_date' => $event->event_date,
        ]);

        return response()->json(['data' => $this->formatEvent($event)], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => $this->formatEvent(Event::findOrFail($id))]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $previous = [
            'title' => $event->title,
            'event_date' => $event->event_date,
            'is_published' => (bool) $event->is_published,
        ];

        $payload = $this->validatedPayload($request, $event);
        $event->update($payload);

        $this->recordActivity('event.updated', $event, $event->id, [
            'before' => $previous,
            'after' => [
                'title' => $event->title,
                'event_date' => $event->event_date,
                'is_published' => (bool) $event->is_published,
            ],
        ]);

        return response()->json(['data' => $this->formatEvent($event->refresh())]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $snapshot = [
            'id' => $event->id,
            'title' => $event->title,
        ];
        $event->delete();

        $this->recordActivity('event.deleted', Event::class, $snapshot['id'], [
            'snapshot' => $snapshot,
        ]);

        return response()->json(['message' => 'Event deleted.']);
    }

    protected function validatedPayload(Request $request, ?Event $event = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'event_date' => ['required', 'date_format:Y-m-d'],
            'event_time' => ['required', 'string', 'max:20', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'location' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $safe = [
            'title' => $this->sanitizePlainText((string) $validated['title'], 255),
            'description' => isset($validated['description']) ? $this->sanitizePlainText((string) $validated['description'], 5000) : null,
            'event_date' => (string) $validated['event_date'],
            'event_time' => (string) $validated['event_time'],
            'location' => isset($validated['location']) ? $this->sanitizePlainText((string) $validated['location'], 255) : null,
            'category' => isset($validated['category']) ? $this->sanitizePlainText((string) $validated['category'], 255) : null,
            'is_published' => isset($validated['is_published']) ? (bool) $validated['is_published'] : (bool) ($event?->is_published ?? true),
            'sort_order' => isset($validated['sort_order']) ? (int) $validated['sort_order'] : (int) ($event?->sort_order ?? 0),
        ];

        if ($request->hasFile('image')) {
            $safe['image_url'] = $this->uploadImageToSupabase($request->file('image'));
        } elseif ($event !== null) {
            $safe['image_url'] = $event->image_url;
        }

        return $safe;
    }

    protected function formatEvent(Event $event): array
    {
        $eventDate = Carbon::parse($event->event_date);
        $eventTime = Carbon::parse((string) $event->event_time);

        return [
            'id' => $event->id,
            'month' => $eventDate->format('M'),
            'day' => $eventDate->format('d'),
            'weekday' => $eventDate->format('D'),
            'time' => $eventTime->format('h:i A'),
            'location' => $event->location,
            'title' => $event->title,
            'description' => $event->description,
            'image_url' => $event->image_url,
            'category' => $event->category,
            'is_published' => (bool) $event->is_published,
            'sort_order' => (int) $event->sort_order,
        ];
    }

    protected function uploadImageToSupabase(UploadedFile $image): string
    {
        $baseUrl = rtrim((string) config('services.supabase.url'), '/');
        $bucket = 'event-images';
        $filename = (string) Str::uuid() . '.' . $image->getClientOriginalExtension();

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('services.supabase.key'),
        ])->attach('file', file_get_contents($image->getRealPath()), $filename)
            ->post($baseUrl . "/storage/v1/object/{$bucket}/{$filename}");

        $response->throw();

        return $baseUrl . "/storage/v1/object/public/{$bucket}/{$filename}";
    }

    protected function sanitizePlainText(string $input, int $maxLength): string
    {
        $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $input) ?? '';
        $trimmed = trim(preg_replace('/\s+/u', ' ', $stripped) ?? '');

        return mb_substr($trimmed, 0, $maxLength, 'UTF-8');
    }
}
