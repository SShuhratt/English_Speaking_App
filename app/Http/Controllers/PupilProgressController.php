<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PupilProgressController extends Controller
{
    public function index(Request $request)
    {
        // Mock progress data for now
        $progress = [
            'total_sessions' => 12,
            'completed_sessions' => 8,
            'learning_path' => 'Intermediate Speaking',
            'average_rating' => 4.8,
        ];

        return Inertia::render('pupil/progress', [
            'progress' => $progress,
        ]);
    }
}
