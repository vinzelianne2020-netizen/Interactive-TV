<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $events = [
            [
                'title' => 'Town Hall Meeting',
                'description' => 'Company updates, plans, and open forum with leadership.',
                'event_date' => '2026-08-03',
                'event_time' => '10:00:00',
                'location' => 'Conference Hall A',
                'image_url' => 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
                'category' => 'Company Event',
                'is_published' => true,
                'sort_order' => 1,
            ],
            [
                'title' => 'Family Day Celebration',
                'description' => 'A day of fun, games, and bonding with employees and their families.',
                'event_date' => '2026-08-08',
                'event_time' => '09:00:00',
                'location' => 'Atrium Lobby',
                'image_url' => 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
                'category' => 'Wellness',
                'is_published' => true,
                'sort_order' => 2,
            ],
            [
                'title' => 'Annual Company Picnic',
                'description' => 'Food, games, and fun for everyone at the company grounds.',
                'event_date' => '2026-08-15',
                'event_time' => '08:00:00',
                'location' => 'Company Grounds',
                'image_url' => 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80',
                'category' => 'Company Event',
                'is_published' => true,
                'sort_order' => 3,
            ],
            [
                'title' => 'Employee Engagement Week',
                'description' => 'Activities and programs built for employee development and community.',
                'event_date' => '2026-08-17',
                'event_time' => '14:00:00',
                'location' => 'Training Room 2',
                'image_url' => 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
                'category' => 'Company Event',
                'is_published' => true,
                'sort_order' => 4,
            ],
            [
                'title' => 'Leadership Summit',
                'description' => 'Empowering leaders, inspiring tomorrow.',
                'event_date' => '2026-08-24',
                'event_time' => '09:00:00',
                'location' => 'Executive Conference Room',
                'image_url' => 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
                'category' => 'Leadership',
                'is_published' => true,
                'sort_order' => 5,
            ],
            [
                'title' => 'Health & Wellness Month',
                'description' => 'Your well-being, our priority. Free check-ups & wellness activities.',
                'event_date' => '2026-08-29',
                'event_time' => '07:30:00',
                'location' => 'Wellness Center',
                'image_url' => 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
                'category' => 'Wellness',
                'is_published' => true,
                'sort_order' => 6,
            ],
        ];

        foreach ($events as $event) {
            DB::table('events')->updateOrInsert(
                ['title' => $event['title'], 'event_date' => $event['event_date']],
                $event + [
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }
}
