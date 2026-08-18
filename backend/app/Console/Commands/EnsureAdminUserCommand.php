<?php

namespace App\Console\Commands;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class EnsureAdminUserCommand extends Command
{
    protected $signature = 'app:ensure-admin-user';
    protected $description = 'Create or reset the primary admin account with hashed credentials.';

    public function handle(): int
    {
        $email = DatabaseSeeder::DEFAULT_ADMIN_EMAIL;
        $password = DatabaseSeeder::DEFAULT_ADMIN_PASSWORD;

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->forceFill([
            'name' => 'Knowles Administrator',
            'email' => $email,
            'password' => Hash::make($password, [
                'rounds' => (int) env('BCRYPT_ROUNDS', 12),
            ]),
            'email_verified_at' => $user->email_verified_at ?? now(),
            'role' => User::ROLE_ADMIN,
        ])->save();

        $this->info(sprintf('Admin account ready: %s (role=%s)', $user->email, $user->role));

        return self::SUCCESS;
    }
}
