<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PupilProfile extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'age', 'phone_number', 'level'];

    public function user() { return $this->belongsTo(User::class); }
}