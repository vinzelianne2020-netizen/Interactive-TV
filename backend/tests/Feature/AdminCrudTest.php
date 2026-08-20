<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Event;
use App\Models\Metric;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    protected function authenticateAdmin(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => User::ROLE_ADMIN]), ['*']);
    }

    public function test_admin_can_create_update_and_delete_event(): void
    {
        $this->authenticateAdmin();
        $this->postJson('/api/admin/events', [
            'title' => 'Safety Workshop',
            'description' => 'A practical safety session.',
            'event_date' => '2026-09-10',
            'event_time' => '09:30:00',
            'location' => 'Training Room',
            'category' => 'Safety',
            'is_published' => true,
            'sort_order' => 1,
        ])->assertCreated();

        $event = Event::query()->firstOrFail();
        $this->getJson('/api/admin/events')->assertOk()->assertJsonPath('data.0.event_date', '2026-09-10');
        $this->putJson("/api/admin/events/{$event->id}", [
            'title' => 'Updated Workshop',
            'description' => 'An updated safety session.',
            'event_date' => '2026-09-11',
            'event_time' => '10:00:00',
            'location' => 'Main Hall',
            'category' => 'Safety',
            'is_published' => true,
            'sort_order' => 1,
        ])->assertOk();
        $this->assertDatabaseHas('events', ['id' => $event->id, 'title' => 'Updated Workshop']);

        $this->deleteJson("/api/admin/events/{$event->id}")->assertOk();
        $this->assertDatabaseMissing('events', ['id' => $event->id]);
    }

    public function test_admin_can_crud_metrics_and_announcements(): void
    {
        $this->authenticateAdmin();
        $metric = $this->postJson('/api/admin/metrics', [
            'key' => 'training_sessions',
            'label' => 'Training Sessions',
            'value' => '12',
            'icon' => 'Users2',
        ])->assertCreated()->json('data.id');
        $this->putJson("/api/admin/metrics/{$metric}", [
            'key' => 'training_sessions',
            'label' => 'Training Sessions',
            'value' => '13',
            'icon' => 'Users2',
        ])->assertOk();
        $this->deleteJson("/api/admin/metrics/{$metric}")->assertOk();

        $announcement = $this->postJson('/api/admin/announcements', [
            'message' => 'All hands at 3 PM.',
            'is_active' => true,
            'sort_order' => 1,
        ])->assertCreated()->json('data.id');
        $this->putJson("/api/admin/announcements/{$announcement}", [
            'message' => 'All hands at 4 PM.',
            'is_active' => true,
            'sort_order' => 1,
        ])->assertOk();
        $this->deleteJson("/api/admin/announcements/{$announcement}")->assertOk();

        $this->assertDatabaseCount('metrics', 0);
        $this->assertDatabaseCount('announcements', 0);
    }

    public function test_admin_can_create_update_and_delete_settings(): void
    {
        $this->authenticateAdmin();
        $this->postJson('/api/admin/settings', [
            'key' => 'office_message',
            'value' => 'Welcome to Knowles Connect',
        ])->assertCreated();

        $this->putJson('/api/admin/settings/office_message', [
            'value' => 'Stay safe and connected.',
        ])->assertOk();
        $this->assertDatabaseHas('settings', ['key' => 'office_message', 'value' => 'Stay safe and connected.']);

        $this->deleteJson('/api/admin/settings/office_message')->assertOk();
        $this->assertDatabaseMissing('settings', ['key' => 'office_message']);
    }

    public function test_public_bootstrap_is_read_only_and_unauthenticated(): void
    {
        Event::create([
            'title' => 'Public Event',
            'event_date' => '2026-09-12',
            'event_time' => '09:00:00',
            'is_published' => true,
        ]);
        Announcement::create(['message' => 'Public notice', 'is_active' => true]);
        Metric::create(['key' => 'safety_score', 'label' => 'Safety Score', 'value' => '98%']);
        Setting::create(['key' => 'app_title', 'value' => 'Knowles Connect']);

        $this->getJson('/api/public/bootstrap')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
            ->assertJsonPath('data.events.0.title', 'Public Event')
            ->assertJsonPath('data.announcements.0.message', 'Public notice')
            ->assertJsonPath('data.metrics.safety_score', '98%')
            ->assertJsonPath('data.settings.app_title', 'Knowles Connect');
    }

    public function test_admin_routes_reject_unauthenticated_requests(): void
    {
        $this->getJson('/api/admin/events')->assertUnauthorized();
    }
}
