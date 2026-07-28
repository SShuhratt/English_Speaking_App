<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportMessage extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'admin_id',
        'subject',
        'message',
        'is_read_by_admin',
        'is_read_by_user',
        'recipient_type',
    ];

    protected $casts = [
        'is_read_by_admin' => 'boolean',
        'is_read_by_user' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
