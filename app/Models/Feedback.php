<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'feedbacks';

    protected $fillable = [
        'conversation_id',
        'pupil_id',
        'teacher_id',
        'rating_score',
        'comment_text',
        'author_id',
    ];

    protected $appends = ['rating', 'comment'];

    public function getRatingAttribute()
    {
        return $this->rating_score;
    }

    public function getCommentAttribute()
    {
        return $this->comment_text;
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function pupil()
    {
        return $this->belongsTo(User::class, 'pupil_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
