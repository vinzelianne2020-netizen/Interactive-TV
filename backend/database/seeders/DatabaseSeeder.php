<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    final public const DEFAULT_ADMIN_EMAIL = 'knowlesadmin@knowles.com';
    final public const DEFAULT_ADMIN_PASSWORD = '@Knowles_admin2026';

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            EventSeeder::class,
            MetricSeeder::class,
            AnnouncementSeeder::class,
            SettingSeeder::class,
        ]);

        $admin = User::query()->where('email', self::DEFAULT_ADMIN_EMAIL)->first();
        if (! $admin) {
            User::query()->create([
                'name' => 'Knowles Administrator',
                'email' => self::DEFAULT_ADMIN_EMAIL,
                'password' => Hash::make(self::DEFAULT_ADMIN_PASSWORD, [
                    'rounds' => (int) env('BCRYPT_ROUNDS', 12),
                ]),
                'email_verified_at' => now(),
                'role' => User::ROLE_ADMIN,
            ]);
        } else {
            $admin->update([
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => $admin->email_verified_at ?? now(),
            ]);

            // Keep the local seeded admin credentials deterministic.
            $admin->update([
                'password' => Hash::make(self::DEFAULT_ADMIN_PASSWORD, [
                    'rounds' => (int) env('BCRYPT_ROUNDS', 12),
                ]),
            ]);
        }

        if (User::query()->where('email', 'test@example.com')->doesntExist()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }
    }
}
