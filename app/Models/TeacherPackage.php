<?php

namespace App\Models;

use Database\Factories\TeacherPackageFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeacherPackage extends Model
{
    /** @use HasFactory<TeacherPackageFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'title',
        'total_hours',
        'total_minutes',
        'price',
        'discount_percentage',
        'description',
        'is_active',
    ];

    protected $casts = [
        'total_hours' => 'integer',
        'total_minutes' => 'integer',
        'price' => 'integer',
        'discount_percentage' => 'integer',
        'is_active' => 'boolean',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function pupilPackages(): HasMany
    {
        return $this->hasMany(PupilPackage::class, 'teacher_package_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
