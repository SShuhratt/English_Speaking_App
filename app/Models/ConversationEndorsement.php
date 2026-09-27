<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConversationEndorsement extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'conversation_id',
        'giver_id',
        'receiver_id',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function giver()
    {
        return $this->belongsTo(User::class, 'giver_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }
}
