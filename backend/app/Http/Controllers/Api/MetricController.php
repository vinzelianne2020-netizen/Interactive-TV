<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Metric;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MetricController extends Controller
{
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
        return response()->json(['data' => Metric::orderBy('key')->get()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $metric = Metric::create($request->validate([
            'key' => ['required', 'string', 'max:255', 'unique:metrics,key'],
            'label' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
        ]));

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
        $metric->update($request->validate([
            'key' => ['required', 'string', 'max:255', Rule::unique('metrics', 'key')->ignore($metric->id)],
            'label' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:255'],
        ]));

        return response()->json(['data' => $metric->refresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        Metric::findOrFail($id)->delete();

        return response()->json(['message' => 'Metric deleted']);
    }
}
