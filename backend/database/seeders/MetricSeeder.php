<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;

class MetricSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('metrics')->upsert([
            [
                'key' => 'training_sessions',
                'label' => 'Training Sessions',
                'value' => '12',
                'icon' => 'Users2',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'safety_score',
                'label' => 'Safety Score',
                'value' => '98%',
                'icon' => 'ShieldCheck',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esg_projects',
                'label' => 'ESG Projects',
                'value' => '8',
                'icon' => 'Leaf',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['key'], ['label', 'value', 'icon', 'updated_at']);
    }
}
