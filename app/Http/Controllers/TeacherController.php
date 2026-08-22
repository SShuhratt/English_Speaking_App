<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\SlotService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TeacherController extends Controller
{
    /**
     * List all teachers for pupils with filtering (all, verified, new, unverified)
     */
    /**
     * List all teachers for pupils with filtering and sorting options
     */
    public function index(Request $request, SlotService $slotService)
    {
        [$query, $filters] = $this->buildTeachersQuery($request);

        $teachers = $query->paginate(12)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) use ($slotService) {
            $teacher->next_slot = $slotService->getNextAvailableSlot($teacher->id);
            $teacher->is_new = $teacher->created_at >= now()->subDays(7);

            return $teacher;
        });

        return Inertia::render('pupil/teachers', [
            'teachers' => $teachers,
            'currentFilters' => $filters,
            'currentFilter' => $filters['status'],
        ]);
    }

    /**
     * Show teacher profile page for pupil
     */
    public function show($id)
    {
        if (! Str::isUuid($id)) {
            abort(404);
        }

        $teacher = User::where('id', $id)
            ->where('role', 'teacher')
            ->with([
                'teacherProfile',
                'feedbacks' => function ($query) {
                    $query->whereHas('author', function ($q) {
                        $q->where('role', 'pupil');
                    })->with('author');
                },
            ])
            ->firstOrFail();

        $teacher->is_new = $teacher->created_at >= now()->subDays(7);

        $currentUser = auth()->user();
        $isPrivileged = $currentUser && ($currentUser->role === 'admin' || $currentUser->id === $teacher->id);

        if (! $isPrivileged && $teacher->teacherProfile && is_array($teacher->teacherProfile->certificates)) {
            $sanitizedCerts = array_map(function ($cert) {
                if (is_array($cert)) {
                    $cert['file_url'] = null;
                    $cert['file_name'] = null;
                }

                return $cert;
            }, $teacher->teacherProfile->certificates);

            $teacher->teacherProfile->certificates = $sanitizedCerts;
        }

        $hasEligibleTrial = ! $currentUser || ! $currentUser->hasBookedWithTeacher($teacher->id);
        $hourlyRate = (float) ($teacher->teacherProfile?->price ?? 0);
        $trialPrice = $hourlyRate > 0 ? (int) (round(($hourlyRate / 3) / 1000) * 1000) : 0;

        return Inertia::render('pupil/teacher-profile', [
            'teacher' => $teacher,
            'hasEligibleTrial' => $hasEligibleTrial,
            'trialPrice' => $trialPrice,
        ]);
    }

    /**
     * Show booking page for a teacher
     */
    public function showBooking(Request $request)
    {
        $teacherId = $request->query('teacher_id');

        if (! $teacherId || ! Str::isUuid($teacherId)) {
            return redirect()->route('pupil.teachers.index');
        }

        $teacher = User::where('id', $teacherId)
            ->where('role', 'teacher')
            ->with('teacherProfile')
            ->first();

        if (! $teacher) {
            return redirect()->route('pupil.teachers.index');
        }

        return Inertia::render('pupil/booking', [
            'teacher' => $teacher,
        ]);
    }

    /**
     * Show teacher directory for teacher role with full filtering and sorting options
     */
    public function teacherDirectory(Request $request, SlotService $slotService)
    {
        [$query, $filters] = $this->buildTeachersQuery($request);

        $teachers = $query->paginate(12)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) use ($slotService) {
            $teacher->next_slot = $slotService->getNextAvailableSlot($teacher->id);
            $teacher->is_new = $teacher->created_at >= now()->subDays(7);

            return $teacher;
        });

        return Inertia::render('teacher/teachers', [
            'teachers' => $teachers,
            'currentFilters' => $filters,
            'currentFilter' => $filters['status'],
        ]);
    }

    /**
     * Build combinable teacher query supporting search by name, status filters, IELTS band sorting, and price sorting
     *
     * @return array{0: Builder, 1: array{status: string, ielts_sort: ?string, price_sort: ?string, search: ?string}}
     */
    private function buildTeachersQuery(Request $request): array
    {
        $status = $request->query('status', $request->query('filter', 'all'));
        $ieltsSort = $request->query('ielts_sort');
        $priceSort = $request->query('price_sort');
        $search = trim((string) $request->query('search', ''));

        // Normalize legacy filter parameters if passed in 'filter' query string
        if ($status === 'ielts_speaking_asc') {
            $ieltsSort = 'asc';
            $status = 'all';
        } elseif ($status === 'ielts_speaking_desc') {
            $ieltsSort = 'desc';
            $status = 'all';
        } elseif ($status === 'price_asc') {
            $priceSort = 'asc';
            $status = 'all';
        } elseif ($status === 'price_desc') {
            $priceSort = 'desc';
            $status = 'all';
        }

        $query = User::where('role', 'teacher')->with('teacherProfile');

        // Name Search Filter (case-insensitive)
        if ($search !== '') {
            $driver = $query->getConnection()->getDriverName();
            $likeOp = $driver === 'pgsql' ? 'ilike' : 'like';
            $query->where('users.full_name', $likeOp, "%{$search}%");
        }

        // Status Filter
        if ($status === 'verified') {
            $query->whereHas('teacherProfile', fn ($q) => $q->where('is_verified', true));
        } elseif ($status === 'unverified') {
            $query->where(function ($q) {
                $q->whereDoesntHave('teacherProfile')
                    ->orWhereHas('teacherProfile', fn ($q2) => $q2->where('is_verified', false));
            });
        } elseif ($status === 'new') {
            $query->where('users.created_at', '>=', now()->subDays(7));
        }

        // Combinable Sorting
        if ($ieltsSort || $priceSort) {
            $query->leftJoin('teacher_profiles', 'users.id', '=', 'teacher_profiles.user_id')
                ->select('users.*');

            if ($ieltsSort) {
                $query->orderBy('teacher_profiles.speaking_band', $ieltsSort);
            }
            if ($priceSort) {
                $query->orderBy('teacher_profiles.price', $priceSort);
            }
        } else {
            $query->orderBy('users.created_at', 'desc');
        }

        return [
            $query,
            [
                'status' => $status,
                'ielts_sort' => $ieltsSort,
                'price_sort' => $priceSort,
                'search' => $search !== '' ? $search : null,
            ],
        ];
    }
}
