<?php

namespace App\Http\Controllers\Api;

use App\Models\Announcement;
use App\Models\Event;
use App\Models\Metric;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class PublicDisplayController
{
    public function bootstrap(): JsonResponse
    {
        $events = Event::where('is_published', true)
            ->orderBy('event_date')
            ->orderBy('sort_order')
            ->limit(50)
            ->get()
            ->map(function (Event $event): array {
                $eventDate = Carbon::parse($event->event_date);
                $eventTime = Carbon::parse((string) $event->event_time);

                return [
                'id' => $event->id,
                'event_date' => $eventDate->format('Y-m-d'),
                'event_time' => $eventTime->format('H:i:s'),
                'month' => $eventDate->format('M'),
                'day' => $eventDate->format('d'),
                'weekday' => $eventDate->format('D'),
                'time' => $eventTime->format('h:i A'),
                'title' => $event->title,
                'description' => $event->description,
                'location' => $event->location,
                'image_url' => $event->image_url,
                'category' => $event->category,
                'is_published' => (bool) $event->is_published,
                'sort_order' => (int) $event->sort_order,
                ];
            })->values();

        $metrics = Metric::pluck('value', 'key')->all();
        $announcements = Announcement::where('is_active', true)
            ->orderBy('sort_order')
            ->limit(50)
            ->get();
        $settings = Setting::pluck('value', 'key')->all();

        return response()->json([
            'data' => compact('events', 'metrics', 'announcements', 'settings'),
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
}
