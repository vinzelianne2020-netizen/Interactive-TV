<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $events = Event::where('is_published', true)
            ->whereDate('event_date', '>=', now()->subDay())
            ->orderBy('event_date')
            ->orderBy('sort_order')
            ->take(6)
            ->get()
            ->map(fn (Event $event) => $this->formatEvent($event));

        return response()->json(['data' => $events]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $event = Event::create($this->validatedPayload($request));

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
        $event->update($this->validatedPayload($request, $event));

        return response()->json(['data' => $this->formatEvent($event->refresh())]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        Event::findOrFail($id)->delete();

        return response()->json(['message' => 'Event deleted']);
    }

    protected function validatedPayload(Request $request, ?Event $event = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_date' => ['required', 'date'],
            'event_time' => ['required', 'string', 'max:20'],
            'location' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image_url'] = $this->uploadImageToSupabase($request->file('image'));
        } elseif ($event !== null) {
            $validated['image_url'] = $event->image_url;
        }

        return $validated;
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
            'is_published' => $event->is_published,
            'sort_order' => $event->sort_order,
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
}
