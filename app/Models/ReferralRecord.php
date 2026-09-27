<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralRecord extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'referrer_id',
        'referred_user_id',
        'reward_granted',
        'reward_granted_at',
        'first_conversation_id',
    ];

    protected $casts = [
        'reward_granted' => 'boolean',
        'reward_granted_at' => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function firstConversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'first_conversation_id');
    }
}
