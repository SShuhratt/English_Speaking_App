<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\PupilPackage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminOverviewController extends Controller
{
    /**
     * Display the comprehensive Admin Overview & Monitoring Dashboard.
     */
    public function index(Request $request): Response
    {
        $period = $request->query('period', 'this_month');
        if (! in_array($period, ['today', 'this_week', 'this_month', 'last_30_days', 'all_time'])) {
            $period = 'this_month';
        }

        [$start, $end, $prevStart, $prevEnd] = $this->resolveDateRanges($period);

        $metrics = $this->calculateMetricsForRange($start, $end);
        $prevMetrics = $prevStart ? $this->calculateMetricsForRange($prevStart, $prevEnd) : null;

        $calcTrend = fn ($curr, $prev) => $prev !== null && $prev > 0
            ? round((($curr - $prev) / $prev) * 100, 1)
            : ($curr > 0 ? 100.0 : 0.0);

        $trends = [
            'total_revenue' => $prevMetrics ? $calcTrend($metrics['total_revenue'], $prevMetrics['total_revenue']) : null,
            'paid_transactions' => $prevMetrics ? $calcTrend($metrics['paid_transactions_count'], $prevMetrics['paid_transactions_count']) : null,
            'completed_sessions' => $prevMetrics ? $calcTrend($metrics['completed_sessions_count'], $prevMetrics['completed_sessions_count']) : null,
            'new_pupils' => $prevMetrics ? $calcTrend($metrics['new_pupils_count'], $prevMetrics['new_pupils_count']) : null,
            'new_teachers' => $prevMetrics ? $calcTrend($metrics['new_teachers_count'], $prevMetrics['new_teachers_count']) : null,
        ];

        // Multi-Period Comparison Matrix
        $matrix = [
            'today' => $this->calculateMetricsForRange(Carbon::today()->startOfDay(), Carbon::today()->endOfDay()),
            'this_week' => $this->calculateMetricsForRange(Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()),
            'this_month' => $this->calculateMetricsForRange(Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()),
            'all_time' => $this->calculateMetricsForRange(null, null),
        ];

        // Timeline Trend Points (Last 14 days or chosen window)
        $timeline = $this->generateTimelineSeries($period, $start, $end);

        // Recent Platform Activity
        $recentTransactions = $this->getRecentTransactions();
        $recentUsers = User::latest()
            ->take(5)
            ->select(['id', 'full_name', 'email', 'role', 'created_at'])
            ->get();

        $pendingVerificationsCount = Appointment::where('status', 'accepted')->count()
            + PupilPackage::where('payment_status', 'verifying')->count();

        return Inertia::render('admin/overview', [
            'period' => $period,
            'metrics' => $metrics,
            'trends' => $trends,
            'matrix' => $matrix,
            'timeline' => $timeline,
            'recentTransactions' => $recentTransactions,
            'recentUsers' => $recentUsers,
            'pendingVerificationsCount' => $pendingVerificationsCount,
        ]);
    }

    /**
     * Resolve current and previous date range tuples based on chosen period.
     *
     * @return array{0: ?Carbon, 1: ?Carbon, 2: ?Carbon, 3: ?Carbon}
     */
    protected function resolveDateRanges(string $period): array
    {
        return match ($period) {
            'today' => [
                Carbon::today()->startOfDay(),
                Carbon::today()->endOfDay(),
                Carbon::yesterday()->startOfDay(),
                Carbon::yesterday()->endOfDay(),
            ],
            'this_week' => [
                Carbon::now()->startOfWeek(),
                Carbon::now()->endOfWeek(),
                Carbon::now()->subWeek()->startOfWeek(),
                Carbon::now()->subWeek()->endOfWeek(),
            ],
            'this_month' => [
                Carbon::now()->startOfMonth(),
                Carbon::now()->endOfMonth(),
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth(),
            ],
            'last_30_days' => [
                Carbon::now()->subDays(30)->startOfDay(),
                Carbon::now()->endOfDay(),
                Carbon::now()->subDays(60)->startOfDay(),
                Carbon::now()->subDays(30)->startOfDay(),
            ],
            default => [
                null,
                null,
                null,
                null,
            ],
        };
    }

    /**
     * Calculate core platform metrics for a given date boundary.
     *
     * @return array<string, int|float>
     */
    protected function calculateMetricsForRange(?Carbon $start, ?Carbon $end): array
    {
        // 1. Direct Bookings Revenue (Confirmed appointments that are NOT package bookings)
        $directAppointmentsQuery = Appointment::where('status', 'confirmed')
            ->where('is_package_booking', false);

        if ($start && $end) {
            $directAppointmentsQuery->whereBetween('created_at', [$start, $end]);
        }

        $directBookingRevenue = (int) $directAppointmentsQuery->sum('price');
        $directBookingCount = (int) $directAppointmentsQuery->count();

        // 2. Package Sales Revenue (Paid PupilPackage records)
        $packagesQuery = PupilPackage::where('payment_status', 'paid');
        if ($start && $end) {
            $packagesQuery->whereBetween('created_at', [$start, $end]);
        }

        $packageSalesRevenue = (int) $packagesQuery->sum('price_paid');
        $packageSalesCount = (int) $packagesQuery->count();

        $totalRevenue = $directBookingRevenue + $packageSalesRevenue;
        $paidTransactionsCount = $directBookingCount + $packageSalesCount;
        $averageOrderValue = $paidTransactionsCount > 0 ? (int) round($totalRevenue / $paidTransactionsCount) : 0;

        // 3. Completed Sessions & Speaking Minutes
        $completedSessionsQuery = Appointment::whereIn('status', ['confirmed', 'completed'])
            ->where('end_at', '<=', now());

        if ($start && $end) {
            $completedSessionsQuery->whereBetween('start_at', [$start, $end]);
        }

        $completedSessionsCount = (int) $completedSessionsQuery->count();
        $speakingMinutes = (int) ($completedSessionsQuery->sum('duration_minutes') ?: ($completedSessionsCount * 30));

        // 4. Upcoming / Scheduled Sessions
        $upcomingSessionsCount = (int) Appointment::whereIn('status', ['accepted', 'confirmed'])
            ->where('start_at', '>', now())
            ->count();

        // 5. Satisfaction Rating (Feedbacks)
        $feedbackQuery = Feedback::query();
        if ($start && $end) {
            $feedbackQuery->whereBetween('created_at', [$start, $end]);
        }
        $avgFeedback = $feedbackQuery->avg('rating_score');
        $satisfactionRating = round((float) ($avgFeedback ?: Feedback::avg('rating_score') ?: 5.0), 1);

        // 6. User Growth
        $pupilsQuery = User::where('role', 'pupil');
        $teachersQuery = User::where('role', 'teacher');
        if ($start && $end) {
            $pupilsQuery->whereBetween('created_at', [$start, $end]);
            $teachersQuery->whereBetween('created_at', [$start, $end]);
        }
        $newPupilsCount = (int) $pupilsQuery->count();
        $newTeachersCount = (int) $teachersQuery->count();

        // 7. Active Teachers & Pupils
        $activeTeachersQuery = User::where('role', 'teacher')
            ->whereHas('teacherAppointments', function ($q) use ($start, $end) {
                $q->whereIn('status', ['accepted', 'confirmed', 'completed']);
                if ($start && $end) {
                    $q->whereBetween('start_at', [$start, $end]);
                }
            });
        $activeTeachersCount = (int) $activeTeachersQuery->count();

        $activePupilsQuery = User::where('role', 'pupil')
            ->whereHas('pupilAppointments', function ($q) use ($start, $end) {
                $q->whereIn('status', ['accepted', 'confirmed', 'completed']);
                if ($start && $end) {
                    $q->whereBetween('start_at', [$start, $end]);
                }
            });
        $activePupilsCount = (int) $activePupilsQuery->count();

        return [
            'total_revenue' => $totalRevenue,
            'direct_booking_revenue' => $directBookingRevenue,
            'package_sales_revenue' => $packageSalesRevenue,
            'paid_transactions_count' => $paidTransactionsCount,
            'average_order_value' => $averageOrderValue,
            'completed_sessions_count' => $completedSessionsCount,
            'speaking_minutes' => $speakingMinutes,
            'upcoming_sessions_count' => $upcomingSessionsCount,
            'satisfaction_rating' => $satisfactionRating,
            'new_pupils_count' => $newPupilsCount,
            'new_teachers_count' => $newTeachersCount,
            'active_teachers_count' => $activeTeachersCount,
            'active_pupils_count' => $activePupilsCount,
        ];
    }

    /**
     * Generate daily series data points for visual trends chart.
     *
     * @return array<int, array{date: string, label: string, revenue: int, sessions: int, users: int}>
     */
    protected function generateTimelineSeries(string $period, ?Carbon $start, ?Carbon $end): array
    {
        $daysCount = match ($period) {
            'today' => 1,
            'this_week' => 7,
            'this_month' => 30,
            default => 14,
        };

        $startDate = $start ? $start->copy()->startOfDay() : Carbon::now()->subDays($daysCount - 1)->startOfDay();
        $endDate = $end ? $end->copy()->endOfDay() : Carbon::now()->endOfDay();

        // Limit maximum days in timeline to 30 for performance & clarity
        if ($startDate->diffInDays($endDate) > 30) {
            $startDate = $endDate->copy()->subDays(29)->startOfDay();
        }

        $series = [];
        $cursor = $startDate->copy();

        while ($cursor->lte($endDate)) {
            $dayStart = $cursor->copy()->startOfDay();
            $dayEnd = $cursor->copy()->endOfDay();

            $dayDirect = (int) Appointment::where('status', 'confirmed')
                ->where('is_package_booking', false)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->sum('price');

            $dayPackages = (int) PupilPackage::where('payment_status', 'paid')
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->sum('price_paid');

            $daySessions = (int) Appointment::whereIn('status', ['confirmed', 'completed'])
                ->whereBetween('start_at', [$dayStart, $dayEnd])
                ->count();

            $dayUsers = (int) User::whereBetween('created_at', [$dayStart, $dayEnd])->count();

            $series[] = [
                'date' => $cursor->format('Y-m-d'),
                'label' => $cursor->format('M d'),
                'revenue' => $dayDirect + $dayPackages,
                'sessions' => $daySessions,
                'users' => $dayUsers,
            ];

            $cursor->addDay();
        }

        return $series;
    }

    /**
     * Get recent transactions combining direct bookings and package purchases.
     *
     * @return array<int, array{type: string, title: string, pupil: string, teacher: string, amount: int, date: string}>
     */
    protected function getRecentTransactions(): array
    {
        $recentDirect = Appointment::where('status', 'confirmed')
            ->where('is_package_booking', false)
            ->with(['pupil:id,full_name', 'teacher:id,full_name'])
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($apt) => [
                'type' => 'appointment',
                'title' => 'Single Session',
                'pupil' => $apt->pupil?->name ?? 'Pupil',
                'teacher' => $apt->teacher?->name ?? 'Teacher',
                'amount' => (int) $apt->price,
                'date' => $apt->created_at->format('M d, H:i'),
                'raw_date' => $apt->created_at->timestamp,
            ]);

        $recentPackages = PupilPackage::where('payment_status', 'paid')
            ->with(['pupil:id,full_name', 'teacher:id,full_name'])
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($pkg) => [
                'type' => 'package',
                'title' => $pkg->package_title ?: 'Speaking Pack',
                'pupil' => $pkg->pupil?->name ?? 'Pupil',
                'teacher' => $pkg->teacher?->name ?? 'Teacher',
                'amount' => (int) $pkg->price_paid,
                'date' => $pkg->created_at->format('M d, H:i'),
                'raw_date' => $pkg->created_at->timestamp,
            ]);

        return $recentDirect->concat($recentPackages)
            ->sortByDesc('raw_date')
            ->take(6)
            ->values()
            ->toArray();
    }
}
