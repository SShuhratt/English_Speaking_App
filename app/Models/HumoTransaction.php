<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HumoTransaction extends Model
{
    protected $fillable = [
        'hash',
        'amount',
        'card_last_digits',
        'channel',
        'bank_timestamp',
        'raw_text',
        'status',
        'matched_type',
        'matched_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
        ];
    }
}
