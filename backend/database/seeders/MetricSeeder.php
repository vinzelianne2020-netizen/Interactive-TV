<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MetricSeeder extends Seeder
{
    public function run(): void
    {
        $metrics = [
            [
                'key' => 'upcoming_events',
                'label' => 'Upcoming Events',
                'value' => '6',
                'icon' => 'CalendarDays',
            ],
            [
                'key' => 'training_sessions',
                'label' => 'Training Sessions',
                'value' => '12',
                'icon' => 'Users2',
            ],
            [
                'key' => 'safety_score',
                'label' => 'Safety Score',
                'value' => '98%',
                'icon' => 'ShieldCheck',
            ],
            [
                'key' => 'esg_projects',
                'label' => 'ESG Projects',
                'value' => '8',
                'icon' => 'Leaf',
            ],
            [
                'key' => 'holidays_next_month',
                'label' => 'Holidays (Next)',
                'value' => '3',
                'icon' => 'CalendarDays',
            ],
            [
                'key' => 'new_hires_this_month',
                'label' => 'New Hires',
                'value' => '6',
                'icon' => 'UserPlus',
            ],
            [
                'key' => 'days_without_lti',
                'label' => 'Days No LTI',
                'value' => '342',
                'icon' => 'ShieldCheck',
            ],
            [
                'key' => 'active_amenities',
                'label' => 'Amenities',
                'value' => '6',
                'icon' => 'Sofa',
            ],
        ];

        foreach ($metrics as $metric) {
            DB::table('metrics')->updateOrInsert(
                ['key' => $metric['key']],
                $metric + [
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }
}
