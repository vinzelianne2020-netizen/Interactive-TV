<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Metric;
use App\Support\RecordsAdminActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MetricController extends Controller
{
    use RecordsAdminActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $upcomingCount = Event::where('is_published', true)
            ->whereDate('event_date', '>=', now())
            ->count();

        $stored = Metric::pluck('value', 'key');

        return response()->json(['data' => [
            'upcoming_events' => $upcomingCount,
            'training_sessions' => $stored['training_sessions'] ?? 0,
            'safety_score' => $stored['safety_score'] ?? '0%',
            'esg_projects' => $stored['esg_projects'] ?? 0,
        ]]);
    }

    /**
     * Display all stored metrics for the admin workspace.
     */
    public function adminIndex(): JsonResponse
    {
        return response()->json(['data' => Metric::orderBy('key')->limit(500)->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $payload = $this->validatedPayload($request);
        $metric = Metric::create($payload);

        $this->recordActivity('metric.created', $metric, $metric->id, [
            'key' => $metric->key,
        ]);

        return response()->json(['data' => $metric], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Metric::findOrFail($id)]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $metric = Metric::findOrFail($id);
        $before = [
            'key' => $metric->key,
            'value' => $metric->value,
        ];

        $payload = $this->validatedPayload($request, $metric);
        $metric->update($payload);

        $this->recordActivity('metric.updated', $metric, $metric->id, [
            'before' => $before,
            'after' => [
                'key' => $metric->key,
                'value' => $metric->value,
            ],
        ]);

        return response()->json(['data' => $metric->refresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $metric = Metric::findOrFail($id);
        $snapshot = ['id' => $metric->id, 'key' => $metric->key];
        $metric->delete();

        $this->recordActivity('metric.deleted', Metric::class, $snapshot['id'], [
            'snapshot' => $snapshot,
        ]);

        return response()->json(['message' => 'Metric deleted.']);
    }

    /**
     * @return array{key:string,label:string,value:string,icon?:string|null}
     */
    protected function validatedPayload(Request $request, ?Metric $metric = null): array
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9_]+$/', Rule::unique('metrics', 'key')->ignore($metric?->id)],
            'label' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_]+$/'],
        ]);

        return [
            'key' => (string) $validated['key'],
            'label' => $this->sanitizePlainText((string) $validated['label'], 255),
            'value' => $this->sanitizePlainText((string) $validated['value'], 255),
            'icon' => isset($validated['icon']) ? (string) $validated['icon'] : ($metric?->icon ?? null),
        ];
    }

    protected function sanitizePlainText(string $input, int $maxLength): string
    {
        $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $input) ?? '';
        $trimmed = trim(preg_replace('/\s+/u', ' ', $stripped) ?? '');

        return mb_substr($trimmed, 0, $maxLength, 'UTF-8');
    }
}
