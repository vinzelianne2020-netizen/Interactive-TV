<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('settings')->upsert([
            [
                'key' => 'app_title',
                'value' => 'Knowles Connect',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'app_subtitle',
                'value' => 'A Digital Interactive Bulletin Board providing employees with real-time access to workplace updates and company announcements.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'footer_message',
                'value' => 'Together, we build a stronger, safer, and more connected workplace.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'footer_thanks',
                'value' => 'Thank you for being part of the Knowles family!',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'company_name',
                'value' => 'Knowles',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'company_tagline',
                'value' => 'Life above all',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'weather_city',
                'value' => 'Cebu City, Philippines',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'events_rotation_seconds',
                'value' => '24',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['key'], ['value', 'updated_at']);
    }
}
