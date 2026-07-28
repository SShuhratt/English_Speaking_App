<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $shuhrat = User::where('email', 'shuhratodilbekov513@gmail.com')->first();
        if ($shuhrat) {
            $shuhrat->update(['gender' => 'male']);
        } else {
            User::create([
                'email' => 'shuhratodilbekov513@gmail.com',
                'full_name' => 'Shuhrat Odilbekov',
                'name' => 'Shuhrat Odilbekov',
                'password' => Hash::make('$Huhrat513'),
                'role' => 'admin',
                'gender' => 'male',
                'email_verified_at' => now(),
            ]);
        }

        User::where('full_name', 'like', '%Shuhrat%')->update(['gender' => 'male']);

        User::updateOrCreate(
            ['email' => 'admin2@convomate.uz'],
            [
                'full_name' => 'ConvoMate System Admin',
                'password' => Hash::make('$HuhratAdmin2026!'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
