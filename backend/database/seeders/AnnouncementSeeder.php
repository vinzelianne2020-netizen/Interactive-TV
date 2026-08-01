<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $announcements = [
            [
                'message' => 'Welcome to the new Knowles Connect bulletin board! Stay informed with company announcements, employee programs, safety campaigns, ESG initiatives, and workplace updates.',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'message' => 'Reminder: Annual Fire Drill is scheduled for the week of August 5. Please review the assembly points and emergency exits posted on the Safety board.',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'message' => 'New benefit release: Mid-Year Bonus 1.25x base for eligible employees. Check the Benefits section for detailed eligibility and payout dates.',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'message' => 'Welcome to our 6 new team members joining this month! Check the New Hire board to get to know them better.',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'message' => 'ESG update: 42% reduction in single-use plastic waste across all 3 Cebu buildings. Thank you, team!',
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($announcements as $item) {
            DB::table('announcements')->updateOrInsert(
                ['message' => $item['message']],
                $item + [
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }
}
