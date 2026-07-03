import { usePage, router } from '@inertiajs/react';

const dictionary = {
    en: {
        // common / layout
        'nav.dashboard': 'Dashboard',
        'nav.booking_requests': 'Booking Requests',
        'nav.my_schedule': 'My Schedule',
        'nav.availability': 'Availability',
        'nav.my_sessions': 'My Sessions',
        'nav.pupil_feedback': 'Pupil Feedback',
        'nav.users': 'Users',
        'nav.all_sessions': 'All Sessions',
        'nav.find_teachers': 'Find Teachers',
        'nav.my_bookings': 'My Bookings',
        'nav.past_sessions': 'Past Sessions',
        'nav.my_progress': 'My Progress',
        'nav.logout': 'Log out',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',

        // settings
        'settings.title': 'Settings',
        'settings.subtitle': 'Manage your account settings and preferences.',
        'settings.profile': 'Profile',
        'settings.security': 'Security',
        'settings.appearance': 'Appearance',
        'settings.save': 'Save',
        'settings.saved': 'Saved.',

        // welcome / landing
        'welcome.nav_features': 'Features',
        'welcome.nav_how_it_works': 'How It Works',
        'welcome.nav_teachers': 'Teachers',
        'welcome.nav_pricing': 'Pricing',
        'welcome.badge': '#1 Ranked Language Platform',
        'welcome.title': 'Speak English',
        'welcome.title_fluently': 'Fluently',
        'welcome.title_with_teachers': 'with Expert Teachers',
        'welcome.one_on_one': '1-on-1',
        'welcome.title_today': 'Today',
        'welcome.view_teachers': 'View Teachers',
        'welcome.subtitle':
            'Book 1-on-1 speaking sessions with certified English teachers. Practice real conversations and get instant AI-powered feedback—all via Google Meet.',
        'welcome.get_started': 'Get Started',
        'welcome.cta_start': 'Start Speaking Today',
        'welcome.cta_how_it_works': 'See How It Works',
        'welcome.trust_learners': '2,500+ Learners',
        'welcome.trust_rating': '4.9/5 Average',
        'welcome.trust_experts': 'Certified IELTS Experts',
        'welcome.features_title': 'Everything You Need to',
        'welcome.features_title_highlight': 'Improve',
        'welcome.features_subtitle':
            'A complete platform designed for serious English learners who want real results',
        'welcome.feature_1_title': 'Live 1-on-1 Sessions',
        'welcome.feature_1_desc':
            'Connect with teachers via Google Meet for interactive speaking practice in real-time.',
        'welcome.feature_2_title': 'Smart Scheduling',
        'welcome.feature_2_desc':
            'Book sessions based on teacher availability. Calendar sync ensures no conflicts.',
        'welcome.feature_3_title': 'Certified Teachers',
        'welcome.feature_3_desc':
            'All teachers are IELTS/CEFR certified with verified speaking band scores.',
        'welcome.feature_4_title': 'Instant Feedback',
        'welcome.feature_4_desc':
            'Get detailed feedback on pronunciation, grammar, and fluency after each session.',
        'welcome.feature_5_title': 'Progress Tracking',
        'welcome.feature_5_desc':
            'Monitor your improvement with detailed statistics and session recordings.',
        'welcome.feature_6_title': 'All Levels Welcome',
        'welcome.feature_6_desc':
            'From beginner to advanced — teachers adapt to your level and learning goals.',
        'welcome.how_title': 'Start Speaking in',
        'welcome.how_title_highlight': '3 Steps',
        'welcome.how_subtitle': 'Getting started is quick and easy',
        'welcome.how_step_1_title': 'Create Your Account',
        'welcome.how_step_1_desc':
            'Sign up as a pupil, choose your English level, and set your learning goals.',
        'welcome.how_step_2_title': 'Browse & Book',
        'welcome.how_step_2_desc':
            'Find certified teachers by rating, availability, and specialization. Book a session.',
        'welcome.how_step_3_title': 'Start Speaking',
        'welcome.how_step_3_desc':
            'Join the Google Meet session, practice speaking, and get feedback to improve.',
        'welcome.teachers_title': 'Meet Our',
        'welcome.teachers_title_highlight': 'Expert Teachers',
        'welcome.teachers_subtitle':
            'Experienced, certified, and passionate about helping you improve',
        'welcome.teachers_experience': 'experience',
        'welcome.pricing_title': 'Simple',
        'welcome.pricing_title_highlight': 'Pricing',
        'welcome.pricing_subtitle':
            'Choose the plan that fits your learning goals',
        'welcome.pricing_most_popular': 'Most Popular',
        'welcome.pricing_free': 'Free',
        'welcome.pricing_month': '/month',
        'welcome.pricing_plan_starter_desc': 'Perfect to try the platform',
        'welcome.pricing_plan_pro_desc': 'For serious learners',
        'welcome.pricing_plan_unlimited_desc': 'Maximum practice time',
        'welcome.pricing_plan_starter_feat_1': '1 free session / month',
        'welcome.pricing_plan_starter_feat_2': 'Browse teacher profiles',
        'welcome.pricing_plan_starter_feat_3': 'Basic progress tracking',
        'welcome.pricing_plan_pro_feat_1': '8 sessions / month',
        'welcome.pricing_plan_pro_feat_2': 'Priority teacher booking',
        'welcome.pricing_plan_pro_feat_3': 'Detailed feedback reports',
        'welcome.pricing_plan_pro_feat_4': 'Session recordings',
        'welcome.pricing_plan_pro_feat_5': 'Progress analytics',
        'welcome.pricing_plan_unlimited_feat_1': 'Unlimited sessions',
        'welcome.pricing_plan_unlimited_feat_2': 'All Pro features',
        'welcome.pricing_plan_unlimited_feat_3': 'Priority support',
        'welcome.pricing_plan_unlimited_feat_4': 'IELTS prep materials',
        'welcome.pricing_plan_unlimited_feat_5': 'Group sessions access',
        'welcome.pricing_plan_starter_cta': 'Start Free',
        'welcome.pricing_plan_pro_cta': 'Get Pro',
        'welcome.pricing_plan_unlimited_cta': 'Go Unlimited',
        'welcome.cta_ready': 'Ready to Start Speaking?',
        'welcome.cta_sub':
            'Join thousands of learners improving their English speaking skills every day.',
        'welcome.cta_btn': 'Create Free Account',
        'welcome.footer_rights': 'All rights reserved.',
        'welcome.home_bento_title': 'Everything you need to master English',
        'welcome.home_bento_subtitle':
            'Designed for professionals and lifelong learners who value quality and efficiency.',
        'welcome.home_bento_1_title': 'AI-Powered Conversation Analysis',
        'welcome.home_bento_1_desc':
            'Our engine analyzes your pronunciation and grammar during live sessions, providing personalized corrections instantly.',
        'welcome.home_bento_1_accuracy': 'ACCURACY 94%',
        'welcome.home_bento_2_title': 'Flexible Scheduling',
        'welcome.home_bento_2_desc':
            'Book sessions 24/7 across any time zone. Your learning never stops.',
        'welcome.home_bento_3_title': 'Topic Discovery',
        'welcome.home_bento_3_desc':
            'Choose from 500+ topics from technology to daily life idioms.',
        'welcome.home_bento_4_title': 'Integrated with Google Meet',
        'welcome.home_bento_4_desc':
            'No new software to install. Use the tools you already know and love for your sessions.',
        'welcome.features_hero_title': 'Everything You Need to Improve',
        'welcome.features_hero_subtitle':
            'A complete platform designed for serious English learners who want real results through immersion and expert coaching.',
        'welcome.features_pers_learning': 'PERSONALIZED LEARNING',
        'welcome.features_journey_title': 'Your journey, curated by experts.',
        'welcome.features_journey_desc':
            "We don't believe in one-size-fits-all. ConvoMate analyzes your speaking patterns to match you with teachers who specialize in your areas of growth.",
        'welcome.features_journey_item_1': 'Targeted Accent Reduction Modules',
        'welcome.features_journey_item_2': 'Business English Specific Tracks',
        'welcome.features_journey_item_3':
            'Exam Prep (IELTS, TOEFL, Cambridge)',
        'welcome.features_cta_ready': 'Ready to speak fluently?',
        'welcome.features_cta_sub':
            'Join 50,000+ learners who have transformed their confidence and career prospects with ConvoMate.',
        'welcome.features_cta_btn': 'Start Your Free Trial',
        'welcome.how_badge': 'SIMPLE JOURNEY',
        'welcome.how_step_1_title_new': 'Create Your Account',
        'welcome.how_step_1_desc_new':
            'Sign up as a pupil, choose your English level, and set your learning goals in under two minutes.',
        'welcome.how_step_2_title_new': 'Browse & Book',
        'welcome.how_step_2_desc_new':
            'Find certified teachers by rating, availability, and specialization. Book a session that fits your schedule.',
        'welcome.how_step_3_title_new': 'Start Speaking',
        'welcome.how_step_3_desc_new':
            'Join the Google Meet session, practice speaking with your tutor, and get instant feedback to improve.',
        'welcome.how_cta_ready': 'Ready to find your voice?',
        'welcome.how_cta_sub':
            "Join thousands of students who have improved their fluency with ConvoMate's personalized teaching approach.",
        'welcome.teachers_hero_title': "Learn from the world's best teachers",
        'welcome.teachers_hero_subtitle':
            'Experienced, certified, and passionate about helping you improve your conversation skills.',
        'welcome.teachers_search_placeholder': 'Search by name or skill',
        'welcome.teachers_all_specialties': 'All Specialties',
        'welcome.teachers_ielts_prep': 'IELTS Preparation',
        'welcome.teachers_business_english': 'Business English',
        'welcome.teachers_kids_teens': 'Kids & Teens',
        'welcome.teachers_sarah_desc':
            'Specializing in advanced conversational techniques and formal exam preparation for over 5 years.',
        'welcome.teachers_james_desc':
            'Expert in business communication and corporate workshop facilitation. I help you speak like a leader.',
        'welcome.teachers_emma_desc':
            'Passionate about teaching younger learners and students starting their English journey from scratch.',
        'welcome.teachers_become_teacher': 'Become a Teacher',
        'welcome.teachers_become_desc':
            'Join our global network of elite educators and earn on your schedule.',
        'welcome.teachers_apply_now': 'Apply Now',
        'welcome.teachers_cta_ready': 'Ready to start your journey?',
        'welcome.teachers_cta_sub':
            'Get your first session free with any teacher this week. No commitment required.',
        'welcome.teachers_cta_btn': 'Book Free Lesson',

        // Auth pages
        'auth.login': 'Log in',
        'auth.register': 'Register',
        'auth.email': 'Email',
        'auth.email_address': 'Email address',
        'auth.password': 'Password',
        'auth.remember_me': 'Remember me',
        'auth.forgot_password': 'Forgot your password?',
        'auth.no_account': "Don't have an account?",
        'auth.registering_with_google': 'Registering with Google:',
        'auth.has_account': 'Already registered?',
        'auth.full_name': 'Full Name',
        'auth.name': 'Name',
        'auth.full_name_placeholder': 'Full name',
        'auth.confirm_password': 'Confirm Password',
        'auth.role': 'I want to register as a',
        'auth.role_pupil': 'Pupil (Student)',
        'auth.role_teacher': 'Teacher (Instructor)',
        'auth.register_button': 'Create Account',
        'auth.login_button': 'Log in',
        'auth.age': 'Age',
        'auth.age_placeholder': 'Enter your age',
        'auth.phone_number': 'Phone Number',
        'auth.target_level': 'English Target Level',
        'auth.select_level': 'Select Level',
        'auth.overall_level': 'Overall IELTS Level / Grade',
        'auth.speaking_band': 'Speaking Band Score',
        'auth.sign_up': 'Sign up',
        'auth.create_account_title': 'Create an account',
        'auth.create_account_desc':
            'Enter your details below to create your account',
        'auth.login_title': 'Log in to your account',
        'auth.login_desc': 'Enter your email and password below to log in',
        'auth.join_as': 'Join as a',
        'auth.pupil_desc': 'Book speaking sessions',
        'auth.teacher_desc': 'Teach & manage schedule',
        'auth.continue_with_google': 'Continue with Google',

        // Pupil booking / teachers list
        'pupil.find_teachers': 'Find a Teacher',
        'pupil.no_teachers': 'No teachers found.',
        'pupil.book_button': 'Book Session',
        'pupil.select_date': 'Select Date',
        'pupil.select_slot': 'Select Time Slot',
        'pupil.custom_time': 'Or request a custom time',
        'pupil.custom_start': 'Start Time',
        'pupil.custom_end': 'End Time',
        'pupil.custom_book': 'Book Custom Time',

        // booking page
        'booking.title': 'Book a Session',
        'booking.subtitle':
            'Reserve a time for your practice session with :name',
        'booking.today': 'Today',
        'booking.day': 'Day',
        'booking.week': 'Week',
        'booking.custom_title': 'Or Request a Custom Time',
        'booking.confirm_title': 'Confirm Booking Request',
        'booking.confirm_message':
            'Are you sure you want to send a booking request to :teacher for :start to :end?',
        'booking.all_time_title': 'Flexible Time Selection',
        'booking.all_time_desc':
            "Please choose a specific start and end time within the teacher's availability range.",
        'booking.all_time_start': 'Start Time',
        'booking.all_time_end': 'End Time',
        'booking.invalid_range':
            'Invalid time range: end time must be after start time and within the available block.',
        'booking.confirm_btn': 'Confirm Request',
        'booking.cancel_btn': 'Cancel',
        'booking.requesting': 'Requesting...',
        'booking.success': 'Session booked! Waiting for teacher approval.',
        'booking.custom_success':
            'Custom session requested! Waiting for teacher approval.',
        'booking.failed': 'Booking failed',
        'booking.no_slots': 'No slots available for this date.',
        'booking.custom_start': 'Start Time',
        'booking.custom_end': 'End Time',
        'booking.custom_submit': 'Request Custom Session',
        'booking.ielts_level': 'IELTS Level',
        'booking.speaking_band': 'Speaking Band',
        'booking.experience': 'Experience',
        'booking.rating': 'Rating',
        'booking.years': 'Years',
        'booking.workplace': 'Workplace',
        'booking.age': 'Age',
        'booking.phone': 'Phone',
        'booking.certificates': 'Certificates',
        'booking.instant_sync_title': 'Instant Booking Sync',
        'booking.instant_sync_desc':
            'Slots disappear instantly as they are booked by other students. You are seeing live availability.',
        'booking.show_sidebar': 'Choose Date',
        'booking.hide_sidebar': 'Hide Picker',

        // Pupil Progress
        'pupil.progress_title': 'My Progress',
        'pupil.progress_desc':
            'Track your English learning journey and feedback from teachers.',
        'pupil.total_sessions': 'Total Sessions',
        'pupil.avg_rating': 'Average Rating',
        'pupil.feedback_history': 'Feedback History',
        'pupil.no_feedback': 'No feedback received yet.',

        // Meeting states
        'meeting.scheduled': 'Scheduled',
        'meeting.join': 'Join Meeting',
        'meeting.start': 'Start Meeting',
        'meeting.not_ready': 'Teacher is not ready yet!',
        'meeting.starting': 'Starting...',

        // Dashboard
        'dashboard.welcome_back': 'Welcome back, :name 👋',
        'dashboard.learning_journey_desc':
            "Here is what's happening with your learning journey.",
        'dashboard.speaking_hours': 'Total Speaking Hours',
        'dashboard.upcoming_sessions': 'Upcoming Sessions',
        'dashboard.avg_rating': 'Average Rating',
        'dashboard.rating_desc': 'Feedback from your teachers',
        'dashboard.no_upcoming': 'No confirmed upcoming sessions.',
        'dashboard.no_upcoming_sub':
            "Your speaking practice starts here! Let's work together towards your goals and reach new heights.",
        'dashboard.book_now': 'Book a Session',
        'dashboard.recent_feedback': 'Recent Feedback',
        'dashboard.no_feedback': 'No feedback received yet.',
        'dashboard.cancel_booking_confirm':
            'Are you sure you want to cancel this booking?',
        'dashboard.cancel_success': 'Booking cancelled successfully',
        'dashboard.cancel_error': 'Failed to cancel booking',
        'dashboard.cancel_button': 'Cancel',
        'dashboard.practice_perfect': 'Practice makes perfect',
        'dashboard.book_more': 'Book more for faster progress',
        'dashboard.hours_unit': 'hours',
        'dashboard.sessions_unit': 'sessions',
        'dashboard.active_unit': 'active',
        'dashboard.level': 'Level :level',
        'dashboard.streak': '🔥 :count Day Streak!',

        'dashboard.teacher_title': 'Teacher Dashboard',
        'dashboard.teacher_subtitle':
            'Welcome back, :name. Manage your sessions and availability.',
        'dashboard.manage_availability': 'Manage Availability',
        'dashboard.google_not_connected': 'Google Calendar Not Connected',
        'dashboard.google_not_connected_desc':
            'Please connect your Google Account to automatically generate Google Meet links for your sessions.',
        'dashboard.connect_google': 'Connect Google Account',
        'dashboard.sessions_today': 'Sessions Today',
        'dashboard.sessions_today_desc': 'Confirmed slots for today',
        'dashboard.total_pupils': 'Total Pupils',
        'dashboard.total_pupils_desc': 'Pupils you have taught',
        'dashboard.your_rating': 'Your Rating',
        'dashboard.your_rating_desc': 'Based on pupil reviews',
        'dashboard.todays_schedule': "Today's Schedule",
        'dashboard.no_appointments_today':
            'No confirmed appointments scheduled for today.',
        'dashboard.no_appointments_today_desc':
            'No sessions scheduled for today.',
        'dashboard.view_calendar': 'View Calendar',
        'dashboard.check_history': 'Check History',
        'teacher.booking_requests_empty_desc':
            'Students booking requests will appear here once submitted.',
        'schedule.empty_desc':
            "You don't have any scheduled sessions on your agenda.",
        'teacher.sessions_empty_desc':
            'Completed past sessions with your feedback will appear here.',
        'teacher.feedback_empty_desc':
            'Feedback from students will appear here once submitted.',
        'sessions.empty_desc': "You don't have any past completed sessions.",
        'Intermediate Speaking': 'Intermediate Speaking',
        'dashboard.pending_feedback': 'Pending Feedback',
        'dashboard.all_caught_up': 'All caught up!',
        'dashboard.all_caught_up_desc':
            "You've submitted feedback for all your past sessions. Great job!",
        'dashboard.cancel_conversation_confirm':
            'Are you sure you want to cancel this conversation?',
        'dashboard.cancel_conversation_success':
            'Conversation cancelled successfully',
        'dashboard.cancel_conversation_error': 'Failed to cancel conversation',
        'dashboard.start_conversation_success':
            'Conversation started! Opening meeting link...',
        'dashboard.start_conversation_error': 'Failed to start conversation',
        'teacher.feedback_title': 'Pupil Feedback',
        'teacher.feedback_desc':
            'See what your students are saying about your sessions, and reviews left for them.',
        'teacher.no_feedback': 'No feedback received yet.',
        'teacher.feedback_author': 'Written by',
        'teacher.feedback_role_pupil': 'Pupil',
        'teacher.feedback_role_teacher': 'Teacher (You)',
        'teacher.feedback_target': 'Feedback for',
        'teacher.feedback_session_info': 'Related Session',
        'teacher.feedback_date': 'Date',
        'teacher.feedback_time': 'Time',
        'teacher.feedback_anonymous': 'Anonymous Student',
        'teacher.appointments_title': 'Manage Appointments',
        'teacher.booking_requests': 'Booking Requests',
        'teacher.booking_requests_desc':
            'Manage your upcoming sessions and approval requests.',
        'teacher.approve': 'Approve',
        'teacher.reject': 'Reject',
        'teacher.cancel': 'Cancel',
        'teacher.no_appointments': 'No appointment requests found.',
        'teacher.loading': 'Loading...',
        'teacher.failed_load': 'Failed to load appointments',
        'teacher.approve_success': 'Appointment approved successfully',
        'teacher.reject_success': 'Appointment rejected successfully',
        'teacher.approve_failed': 'Failed to approve appointment',
        'teacher.reject_failed': 'Failed to reject appointment',
        'teacher.confirm_cancel':
            'Are you sure you want to cancel this booking?',
        'teacher.cancel_success': 'Booking cancelled successfully',
        'schedule.title': 'My Schedule',
        'schedule.desc': 'Your upcoming confirmed sessions.',
        'schedule.scheduled': 'Scheduled',
        'schedule.starting': 'Starting...',
        'schedule.join': 'Join Meeting',
        'schedule.start': 'Start Meeting',
        'schedule.none': 'No upcoming sessions scheduled.',
        'schedule.confirm_cancel':
            'Are you sure you want to cancel this conversation?',
        'schedule.cancel_success': 'Conversation cancelled successfully',
        'schedule.cancel_failed': 'Failed to cancel conversation',
        'schedule.start_success':
            'Conversation started! Opening meeting link...',
        'schedule.start_failed': 'Failed to start conversation',
        'teacher.sessions_title': 'My Sessions',
        'teacher.sessions_desc':
            'History of your past and upcoming teaching sessions.',
        'teacher.sessions_leave_feedback': 'Leave Feedback',
        'teacher.sessions_feedback_left': 'Feedback Left',
        'teacher.sessions_your_feedback': 'Your Session Feedback',
        'teacher.sessions_none': 'No sessions found.',
        'teacher.sessions_dialog_title': 'Leave Feedback for Student',
        'teacher.sessions_dialog_desc':
            "Write feedback about :name's English performance and areas of improvement.",
        'teacher.sessions_feedback_notes': 'Feedback / Lesson Notes',
        'teacher.sessions_feedback_placeholder':
            "Describe the pupil's performance. Focus on speaking flow, pronunciation, and vocabulary recommendations...",

        'dashboard.speaking_practice': 'English Speaking Practice',
        'dashboard.conversation_practice': 'English Conversation Practice',
        'dashboard.with_pupil': 'with :name',
        'dashboard.with_teacher': 'with Teacher :name',
        'teachers.browse': 'Browse Teachers',
        'teachers.meet_expert': 'Meet Our Expert Teachers',
        'teachers.subtitle':
            'Book a 1-on-1 session with a certified professional.',
        'teachers.none_available': 'No teachers available at the moment.',
        'teachers.certified': 'Certified',
        'teachers.speaking': 'Speaking: :band',
        'teachers.years_experience': ':count y experience',
        'teachers.reviews_count': ':count reviews',
        'teachers.book_session': 'Book Session',
        'teachers.view_profile': 'View Profile',
        'teachers.profile_title': 'Teacher Profile',
        'teachers.workplace': 'Workplace',
        'teachers.age': 'Age',
        'teachers.certificates': 'Certificates',
        'teachers.no_certificates': 'No certificates uploaded yet.',
        'teachers.feedback_title': 'Pupil Feedback',
        'teachers.no_feedback': 'No feedback available yet.',
        'teachers.book_now': 'Book Now',
        'labels.title': 'Teaching Focus',
        'labels.mock': 'Mock Exam / Interview',
        'labels.freestyle': 'Freestyle Conversation',
        'labels.lessons': 'Structured Lessons',
        'labels.business english': 'Business English',
        'labels.practice q&a': 'Practice Q&A',
        'bookings.title': 'My Bookings',
        'bookings.desc': 'Manage your upcoming and pending lesson requests.',
        'bookings.teacher_label': 'Teacher: :name',
        'bookings.none': "You haven't booked any sessions yet.",
        'bookings.none_desc':
            'Schedule a speaking session with one of our certified teachers to get started.',
        'bookings.status_confirmed': 'Confirmed',
        'bookings.status_pending': 'Pending',
        'bookings.status_cancelled': 'Cancelled',
        'bookings.delete': 'Delete Record',
        'bookings.delete_confirm':
            'Are you sure you want to delete this session record?',
        'bookings.delete_success': 'Session record deleted successfully',
        'bookings.delete_error': 'Failed to delete session record',
        'sessions.past_title': 'Past Sessions',
        'sessions.past_desc':
            'A history of your completed English practice sessions.',
        'sessions.leave_feedback': 'Leave Feedback',
        'sessions.feedback_left': 'Feedback Left',
        'sessions.your_review': 'Your Review',
        'sessions.none': 'No past sessions found.',
        'sessions.rating_label': 'Session Rating (:score/10)',
        'sessions.comments_label': 'Your Comments',
        'sessions.comments_placeholder':
            "Describe your session. How was the teacher's pace, clarity, and helpfulness?",
        'sessions.submitting': 'Submitting...',
        'sessions.submit_btn': 'Submit Feedback',
        'sessions.dialog_desc':
            'Share your feedback for your session with :name.',
        'progress.title': 'My Progress',
        'progress.desc':
            'Track your learning journey and speaking improvements.',
        'progress.path': 'Path',
        'progress.sessions': 'Sessions',
        'progress.rating': 'Rating',
        'progress.certificates': 'Certificates',
        'progress.earned': ':count Earned',
        'progress.keep_practicing': 'Keep Practicing!',
        'progress.keep_practicing_desc':
            'Your speaking performance is improving. Book more sessions to level up your fluency and accuracy.',
        'progress.lessons_count': '/ :count lessons',
        'progress.rating_count': '/ 5.0 rating',
        'progress.completion_title': 'Learning Journey Completion',
        'progress.completion_desc':
            'Completed :completed out of :total scheduled lessons on ConvoMate.',
        'profile.title': 'Profile',
        'profile.desc': 'Update your name and email address',
        'profile.name': 'Name',
        'profile.fullname_placeholder': 'Full name',
        'profile.email': 'Email address',
        'profile.teacher_info': 'Teacher Profile Information',
        'profile.teacher_desc':
            'Provide information about your certifications, IELTS scores, and availability.',
        'profile.age': 'Age',
        'profile.phone': 'Phone Number',
        'profile.overall': 'Overall IELTS Level / Grade',
        'profile.speaking': 'Speaking Band Score',
        'profile.experience': 'Years of Experience',
        'profile.workplace': 'Current Workplace / Institution',
        'profile.certificates': 'Certificates (Comma-separated)',
        'profile.pupil_info': 'Pupil Profile Information',
        'profile.pupil_desc':
            'Fill in your profile details to help teachers adapt lessons to your level.',
        'profile.target_level': 'English Target Level',
        'profile.select_level': 'Select Level',
        'profile.email_unverified': 'Your email address is unverified.',
        'profile.resend_btn': 'Click here to re-send the verification email.',
        'profile.resend_sent':
            'A new verification link has been sent to your email address.',
        'profile.save': 'Save',
        'profile.level_beginner': 'Beginner',
        'profile.level_pre_int': 'Pre-Intermediate',
        'profile.level_upper_int': 'Upper-Intermediate',
        'profile.level_advanced': 'Advanced',
        'profile.level_ielts': 'IELTS Band',
        'profile.level_cefr': 'CEFR Band',
        'security.title': 'Security settings',
        'security.update_password': 'Update password',
        'security.update_password_desc':
            'Ensure your account is using a long, random password to stay secure',
        'security.current_password': 'Current password',
        'security.new_password': 'New password',
        'security.confirm_password': 'Confirm password',
        'appearance.title': 'Appearance settings',
        'appearance.desc': 'Update the appearance settings for your account',
        'appearance.light': 'Light',
        'appearance.dark': 'Dark',
        'appearance.system': 'System',
    },
    uz: {
        // common / layout
        'nav.dashboard': 'Boshqaruv paneli',
        'nav.booking_requests': "Bandlik so'rovlari",
        'nav.my_schedule': 'Mening jadvalim',
        'nav.availability': 'Bandlik vaqtlari',
        'nav.my_sessions': 'Mening darslarim',
        'nav.pupil_feedback': "O'quvchilar fikri",
        'nav.users': 'Foydalanuvchilar',
        'nav.all_sessions': 'Barcha darslar',
        'nav.find_teachers': "O'qituvchilar",
        'nav.my_bookings': 'Buyurtmalarim',
        'nav.past_sessions': "O'tgan darslar",
        'nav.my_progress': 'Mening natijalarim',
        'nav.logout': 'Chiqish',
        'nav.profile': 'Profil',
        'nav.settings': 'Sozlamalar',

        // settings
        'settings.title': 'Sozlamalar',
        'settings.subtitle':
            'Hisob sozlamalari va afzalliklaringizni boshqaring.',
        'settings.profile': 'Profil',
        'settings.security': 'Xavfsizlik',
        'settings.appearance': 'Mavzu',
        'settings.save': 'Saqlash',
        'settings.saved': 'Saqlandi.',

        // welcome / landing
        'welcome.nav_features': 'Imkoniyatlar',
        'welcome.nav_how_it_works': 'Qanday ishlaydi',
        'welcome.nav_teachers': "O'qituvchilar",
        'welcome.nav_pricing': 'Tariflar',
        'welcome.badge': '#1 Reytingdagi til platformasi',
        'welcome.title': 'Ingliz tilida',
        'welcome.title_fluently': 'Erkin',
        'welcome.title_with_teachers': 'ingliz tilida erkin',
        'welcome.one_on_one': 'so‘zlashing',
        'welcome.title_today': 'gapiring',
        'welcome.view_teachers': "O'qituvchilarni ko'rish",
        'welcome.subtitle':
            "Sertifikatlangan ingliz tili o'qituvchilari bilan 1 ga 1 darslar bron qiling. Google Meet orqali muloqot amaliyotini o'tang, tezkor fikr-mulohaza oling va natijangizni kuzating.",
        'welcome.get_started': 'Boshlash',
        'welcome.cta_start': 'Bugunoq gapirishni boshlang',
        'welcome.cta_how_it_works': "Qanday ishlashini ko'ring",
        'welcome.trust_learners': '2,500+ faol talaba',
        'welcome.trust_rating': "4.9/5 o'rtacha reyting",
        'welcome.trust_experts': 'Sertifikatlangan IELTS ekspertlari',
        'welcome.features_title': 'Barcha kerakli narsalar sizning',
        'welcome.features_title_highlight': 'rivojlanishingiz uchun',
        'welcome.features_subtitle':
            "Haqiqiy natijalarni xohlaydigan ingliz tili o'rganuvchilari uchun mo'ljallangan to'liq platforma",
        'welcome.feature_1_title': 'Jonli 1 ga 1 darslar',
        'welcome.feature_1_desc':
            "Haqiqiy vaqt rejimida interaktiv so'zlashuv amaliyoti uchun Google Meet orqali o'qituvchilar bilan bog'laning.",
        'welcome.feature_2_title': 'Aqlli dars jadvali',
        'welcome.feature_2_desc':
            "Darslarni o'qituvchining bo'sh vaqtiga qarab bron qiling. Kalendar sinxronizatsiyasi to'qnashuvlar bo'lmasligini ta'minlaydi.",
        'welcome.feature_3_title': "Sertifikatlangan o'qituvchilar",
        'welcome.feature_3_desc':
            "Barcha o'qituvchilar tasdiqlangan IELTS/CEFR sertifikatlariga ega.",
        'welcome.feature_4_title': 'Tezkor fikr-mulohazalar',
        'welcome.feature_4_desc':
            "Har bir darsdan so'ng talaffuz, grammatika va nutq ravonligingiz bo'yicha batafsil fikr-mulohaza oling.",
        'welcome.feature_5_title': 'Rivojlanishni kuzatish',
        'welcome.feature_5_desc':
            'Batafsil statistika va dars yozuvlari yordamida natijalaringizni kuzatib boring.',
        'welcome.feature_6_title': 'Barcha darajalar uchun',
        'welcome.feature_6_desc':
            "Boshlang'ichdan ilg'orgacha — o'qituvchilar sizning darajangiz va maqsadlaringizga moslashadi.",
        'welcome.how_title': 'Gapirishni boshlang atigi',
        'welcome.how_title_highlight': '3 qadamda',
        'welcome.how_subtitle': 'Boshlash juda tez va oson',
        'welcome.how_step_1_title': 'Profil yaratish',
        'welcome.how_step_1_desc':
            "O'quvchi sifatida ro'yxatdan o'ting, ingliz tili darajangizni tanlang va maqsadlaringizni belgilang.",
        'welcome.how_step_2_title': 'Tanlash va bron qilish',
        'welcome.how_step_2_desc':
            "O'qituvchilarni reytingi, bo'sh vaqti va ixtisoslashuviga qarab toping. Dars bron qiling.",
        'welcome.how_step_3_title': 'Gapirishni boshlang',
        'welcome.how_step_3_desc':
            "Google Meet darsiga qo'shiling, so'zlashuvni mashq qiling va rivojlanish uchun fikr-mulohazalar oling.",
        'welcome.teachers_title': 'Bizning',
        'welcome.teachers_title_highlight': "professional o'qituvchilarimiz",
        'welcome.teachers_subtitle':
            'Tajribali, sertifikatlangan va sizga yordam berishga tayyor mutaxassislar',
        'welcome.teachers_experience': 'tajriba',
        'welcome.pricing_title': 'Oddiy va shaffof',
        'welcome.pricing_title_highlight': 'Tariflar',
        'welcome.pricing_subtitle':
            "O'quv maqsadlaringizga mos keladigan rejani tanlang",
        'welcome.pricing_most_popular': 'Eng ommabop',
        'welcome.pricing_free': 'Bepul',
        'welcome.pricing_month': '/oy',
        'welcome.pricing_plan_starter_desc':
            "Platformani sinab ko'rish uchun mukammal",
        'welcome.pricing_plan_pro_desc': "Jiddiy o'rganuvchilar uchun",
        'welcome.pricing_plan_unlimited_desc': "Maksimal mashg'ulot vaqti",
        'welcome.pricing_plan_starter_feat_1': 'oyiga 1 ta bepul dars',
        'welcome.pricing_plan_starter_feat_2':
            "O'qituvchilar profillarini ko'rish",
        'welcome.pricing_plan_starter_feat_3': 'Rivojlanishni oddiy kuzatish',
        'welcome.pricing_plan_pro_feat_1': 'oyiga 8 ta dars',
        'welcome.pricing_plan_pro_feat_2': 'Ustuvor bron qilish',
        'welcome.pricing_plan_pro_feat_3': 'Batafsil fikr-mulohazalar',
        'welcome.pricing_plan_pro_feat_4': 'Dars yozuvlari',
        'welcome.pricing_plan_pro_feat_5': 'Rivojlanish tahlili',
        'welcome.pricing_plan_unlimited_feat_1': 'Cheksiz darslar',
        'welcome.pricing_plan_unlimited_feat_2': 'Barcha Pro imkoniyatlari',
        'welcome.pricing_plan_unlimited_feat_3': 'Ustuvor yordam',
        'welcome.pricing_plan_unlimited_feat_4':
            'IELTS tayyorgarlik materiallari',
        'welcome.pricing_plan_unlimited_feat_5': 'Guruh darslariga kirish',
        'welcome.pricing_plan_starter_cta': 'Bepul boshlash',
        'welcome.pricing_plan_pro_cta': 'Pro-ni olish',
        'welcome.pricing_plan_unlimited_cta': "Cheksiz tarifga o'tish",
        'welcome.cta_ready': 'Gapirishni boshlashga tayyormisiz?',
        'welcome.cta_sub':
            "Har kuni ingliz tili so'zlashuv ko'nikmalarini oshirayotgan minglab o'quvchilarga qo'shiling.",
        'welcome.cta_btn': 'Bepul hisob yaratish',
        'welcome.footer_rights': 'Barcha huquqlar himoyalangan.',
        'welcome.home_bento_title':
            "Ingliz tilini mukammal o'rganish uchun barcha imkoniyatlar",
        'welcome.home_bento_subtitle':
            "Sifat va samaradorlikni qadrlaydigan mutaxassislar va umrbod o'rganuvchilar uchun mo'ljallangan.",
        'welcome.home_bento_1_title':
            "Sun'iy intellekt asosida muloqot tahlili",
        'welcome.home_bento_1_desc':
            'Dasturimiz jonli darslar davomida talaffuzingiz va grammatikangizni tahlil qilib, tezkor tavsiyalar beradi.',
        'welcome.home_bento_1_accuracy': 'ANIQLIK 94%',
        'welcome.home_bento_2_title': 'Moslashuvchan dars jadvali',
        'welcome.home_bento_2_desc':
            "Sutka davomida istalgan vaqtda dars bron qiling. O'rganishdan to'xtamang.",
        'welcome.home_bento_3_title': "Mavzular to'plami",
        'welcome.home_bento_3_desc':
            "Texnologiyadan kundalik iboralargacha bo'lgan 500 dan ortiq mavzulardan tanlang.",
        'welcome.home_bento_4_title': 'Google Meet bilan integratsiya',
        'welcome.home_bento_4_desc':
            "Yangi dasturlar o'rnatish shart emas. Darslar uchun o'zingiz bilgan va sevadigan vositadan foydalaning.",
        'welcome.features_hero_title':
            'Rivojlanishingiz uchun barcha sharoitlar',
        'welcome.features_hero_subtitle':
            "Chuqur o'rganish va ekspertlar yordamida haqiqiy natijalarga erishmoqchi bo'lgan ingliz tili o'rganuvchilari uchun to'liq platforma.",
        'welcome.features_pers_learning': "SHAXSIYLASHTIRILGAN O'QITISH",
        'welcome.features_journey_title':
            "Sizning yo'lingiz ekspertlar tomonidan tuzilgan.",
        'welcome.features_journey_desc':
            "Biz hammaga bir xil yondashuvga ishonmaymiz. ConvoMate sizning gapirish uslubingizni tahlil qilib, sizni eng kerakli yo'nalishdagi o'qituvchilar bilan bog'laydi.",
        'welcome.features_journey_item_1':
            "Aksentni kamaytirish bo'yicha maxsus modullar",
        'welcome.features_journey_item_2': "Biznes ingliz tili yo'nalishlari",
        'welcome.features_journey_item_3':
            'Imtihonlarga tayyorgarlik (IELTS, TOEFL, Cambridge)',
        'welcome.features_cta_ready': 'Erkin gapirishga tayyormisiz?',
        'welcome.features_cta_sub':
            "ConvoMate yordamida o'ziga bo'lgan ishonchini va martabasini oshirgan 50,000+ o'rganuvchilarga qo'shiling.",
        'welcome.features_cta_btn': 'Bepul sinovni boshlash',
        'welcome.how_badge': 'ODDIY JARAYON',
        'welcome.how_step_1_title_new': 'Profil yaratish',
        'welcome.how_step_1_desc_new':
            "O'quvchi sifatida ro'yxatdan o'ting, ingliz tili darajangizni tanlang va ikki daqiqa ichida maqsadlaringizni belgilang.",
        'welcome.how_step_2_title_new': 'Tanlash va bron qilish',
        'welcome.how_step_2_desc_new':
            "O'qituvchilarni reytingi, boş vaqti va ixtisosligiga qarab toping. Jadvalingizga mos keladigan dars bron qiling.",
        'welcome.how_step_3_title_new': 'Gapirishni boshlang',
        'welcome.how_step_3_desc_new':
            "Google Meet darsiga qo'shiling, ustoz bilan so'zlashuv amaliyotini o'tang va yaxshilanish uchun tezkor baho oling.",
        'welcome.how_cta_ready': "O'z ovozingizni topishga tayyormisiz?",
        'welcome.how_cta_sub':
            "ConvoMate-ning shaxsiylashtirilgan yondashuvi yordamida nutq ravonligini oshirgan minglab o'quvchilarga qo'shiling.",
        'welcome.teachers_hero_title':
            "Dunyoning eng yaxshi o'qituvchilaridan o'rganing",
        'welcome.teachers_hero_subtitle':
            "Muloqot ko'nikmalaringizni rivojlantirishga yordam beradigan tajribali, sertifikatlangan va g'ayratli mutaxassislar.",
        'welcome.teachers_search_placeholder':
            "Ism yoki ko'nikma bo'yicha qidirish",
        'welcome.teachers_all_specialties': "Barcha yo'nalishlar",
        'welcome.teachers_ielts_prep': 'IELTS-ga tayyorgarlik',
        'welcome.teachers_business_english': 'Biznes ingliz tili',
        'welcome.teachers_kids_teens': "Bolalar va o'smirlar",
        'welcome.teachers_sarah_desc':
            "5 yildan ortiq vaqt davomida chuqur muloqot texnikasi va rasmiy imtihonlarga tayyorlash bo'yicha ixtisoslashgan.",
        'welcome.teachers_james_desc':
            "Biznes muloqot va korporativ treninglar bo'yicha ekspert. Men sizga yetakchidek gapirishga yordam beraman.",
        'welcome.teachers_emma_desc':
            "Yosh o'rganuvchilarga va ingliz tilini noldan boshlayotgan talabalarga dars berishga ishtiyoqi baland.",
        'welcome.teachers_become_teacher': "O'qituvchi bo'ling",
        'welcome.teachers_become_desc':
            "Elita o'qituvchilari tarmog'imizga qo'shiling va o'z jadvalingiz bo'yicha daromad oling.",
        'welcome.teachers_apply_now': 'Hozir topshirish',
        'welcome.teachers_cta_ready': "Yo'lingizni boshlashga tayyormisiz?",
        'welcome.teachers_cta_sub':
            "Shu haftada istalgan o'qituvchi bilan birinchi darsingizni bepul oling. Hech qanday majburiyat yo'q.",
        'welcome.teachers_cta_btn': 'Bepul dars bron qilish',

        // Auth pages
        'auth.login': 'Tizimga kirish',
        'auth.register': "Ro'yxatdan o'tish",
        'auth.email': 'Email pochta',
        'auth.email_address': 'Email pochta manzili',
        'auth.password': 'Parol',
        'auth.remember_me': 'Eslab qolish',
        'auth.forgot_password': 'Parolni unutdingizmi?',
        'auth.no_account': "Hisobingiz yo'qmi?",
        'auth.registering_with_google': "Google orqali ro'yxatdan o'tilmoqda:",
        'auth.has_account': "Ro'yxatdan o'tganmisiz?",
        'auth.full_name': "To'liq ismingiz",
        'auth.name': 'Ism',
        'auth.full_name_placeholder': "To'liq ism",
        'auth.confirm_password': 'Parolni tasdiqlang',
        'auth.role': "Ro'yxatdan o'tish turi",
        'auth.role_pupil': "O'quvchi (Student)",
        'auth.role_teacher': "O'qituvchi (Instructor)",
        'auth.register_button': 'Hisob yaratish',
        'auth.login_button': 'Kirish',
        'auth.age': 'Yosh',
        'auth.age_placeholder': 'Yoshingizni kiriting',
        'auth.phone_number': 'Telefon raqami',
        'auth.target_level': 'Ingliz tili darajangiz',
        'auth.select_level': 'Darajani tanlang',
        'auth.overall_level': 'Umumiy IELTS darajasi',
        'auth.speaking_band': 'Gapirish (Speaking) balli',
        'auth.sign_up': "Ro'yxatdan o'tish",
        'auth.create_account_title': 'Hisob yaratish',
        'auth.create_account_desc':
            "Ro'yxatdan o'tish uchun ma'lumotlaringizni kiriting",
        'auth.login_title': 'Hisobingizga kiring',
        'auth.login_desc':
            'Tizimga kirish uchun email va parolingizni kiriting',
        'auth.join_as': "Ro'yxatdan o'tish turi",
        'auth.pupil_desc': 'Darslarni bron qilish',
        'auth.teacher_desc': 'Dars berish va jadvalni boshqarish',
        'auth.continue_with_google': 'Continue with Google',

        // Pupil booking / teachers list
        'pupil.find_teachers': "O'qituvchi topish",
        'pupil.no_teachers': "O'qituvchilar topilmadi.",
        'pupil.book_button': 'Dars bron qilish',
        'pupil.select_date': 'Sanani tanlang',
        'pupil.select_slot': "Vaqt oralig'ini tanlang",
        'pupil.custom_time': "Yoki maxsus vaqt so'rang",
        'pupil.custom_start': 'Boshlanish vaqti',
        'pupil.custom_end': 'Tugash vaqti',
        'pupil.custom_book': 'Maxsus vaqtni bron qilish',

        // booking page
        'booking.title': 'Darsni bron qilish',
        'booking.subtitle':
            "O'qituvchi :name bilan amaliyot darsingiz uchun vaqtni band qiling",
        'booking.today': 'Bugun',
        'booking.day': 'Kun',
        'booking.week': 'Hafta',
        'booking.custom_title': "Yoki maxsus vaqt so'rang",
        'booking.confirm_title': "Bron so'rovini tasdiqlash",
        'booking.confirm_message':
            "Haqiqatan ham :teacher o'qituvchiga :start dan :end gacha bo'lgan vaqtga dars bron qilish so'rovini yubormoqchimisiz?",
        'booking.all_time_title': 'Moslashuvchan vaqtni tanlash',
        'booking.all_time_desc':
            "Iltimos, o'qituvchining bo'sh vaqt oralig'ida aniq boshlanish va tugash vaqtini tanlang.",
        'booking.all_time_start': 'Boshlanish vaqti',
        'booking.all_time_end': 'Tugash vaqti',
        'booking.invalid_range':
            "Noto'g'ri vaqt oralig'i: tugash vaqti boshlanish vaqtidan keyin bo'lishi va bo'sh vaqt oralig'ida joylashishi kerak.",
        'booking.confirm_btn': "So'rovni tasdiqlash",
        'booking.cancel_btn': 'Bekor qilish',
        'booking.requesting': 'Yuborilmoqda...',
        'booking.success':
            "Dars bron qilindi! O'qituvchi tasdiqlashini kuting.",
        'booking.custom_success':
            "Maxsus dars so'raldi! O'qituvchi tasdiqlashini kuting.",
        'booking.failed': 'Bron qilish muvaffaqiyatsiz tugadi',
        'booking.no_slots': "Ushbu sana uchun bo'sh vaqtlar yo'q.",
        'booking.custom_start': 'Boshlanish vaqti',
        'booking.custom_end': 'Tugash vaqti',
        'booking.custom_submit': "Maxsus darsni so'rash",
        'booking.ielts_level': 'IELTS darajasi',
        'booking.speaking_band': 'Speaking balli',
        'booking.experience': 'Tajriba',
        'booking.rating': 'Reyting',
        'booking.years': 'yil',
        'booking.workplace': 'Ish joyi',
        'booking.age': 'Yosh',
        'booking.phone': 'Telefon',
        'booking.certificates': 'Sertifikatlar',
        'booking.instant_sync_title': 'Tezkor sinxronizatsiya',
        'booking.instant_sync_desc':
            "Boshqa talabalar darslarni bron qilishi bilan joylar yo'qoladi. Siz jonli jadvalni ko'ryapsiz.",
        'booking.show_sidebar': 'Sana tanlash',
        'booking.hide_sidebar': 'Yashirish',

        // Pupil Progress
        'pupil.progress_title': 'Mening natijalarim',
        'pupil.progress_desc':
            "Ingliz tili o'rganish yo'lingizni va o'qituvchilar fikrlarini kuzatib boring.",
        'pupil.total_sessions': 'Jami darslar',
        'pupil.avg_rating': "O'rtacha baho",
        'pupil.feedback_history': 'Fikrlar tarixi',
        'pupil.no_feedback': "Hozircha hech qanday fikr yo'q.",

        // Meeting states
        'meeting.scheduled': 'Rejalashtirilgan',
        'meeting.join': "Darsga qo'shilish",
        'meeting.start': 'Darsni boshlash',
        'meeting.not_ready': "O'qituvchi hali darsni boshlamadi!",
        'meeting.starting': 'Boshlanmoqda...',

        // Dashboard
        'dashboard.welcome_back': 'Xush kelibsiz, :name 👋',
        'dashboard.learning_journey_desc':
            "O'rganish yo'lingizdagi so'nggi yangiliklar va natijalar.",
        'dashboard.speaking_hours': 'Jami gapirish vaqti',
        'dashboard.upcoming_sessions': 'Kelgusi darslar',
        'dashboard.avg_rating': "O'rtacha baho",
        'dashboard.rating_desc':
            "O'qituvchilaringiz tomonidan berilgan baholar",
        'dashboard.no_upcoming': 'Tasdiqlangan kelgusi darslar mavjud emas.',
        'dashboard.no_upcoming_sub':
            'Sizning gapirish amaliyotingiz shu yerda boshlanadi! Keling, birgalikda maqsadlaringiz sari harakat qilamiz va yangi marralarni zabt etamiz.',
        'dashboard.book_now': 'Dars band qilish',
        'dashboard.recent_feedback': "So'nggi fikrlar",
        'dashboard.no_feedback': 'Hozircha fikrlar mavjud emas.',
        'dashboard.cancel_booking_confirm':
            'Ushbu darsni bekor qilishni xohlaysizmi?',
        'dashboard.cancel_success': 'Dars muvaffaqiyatli bekor qilindi',
        'dashboard.cancel_error': 'Darsni bekor qilishda xatolik yuz berdi',
        'dashboard.cancel_button': 'Bekor qilish',
        'dashboard.practice_perfect': 'Amaliyot mukammallikka yetaklaydi',
        'dashboard.book_more':
            "Tezroq natijaga erishish uchun ko'proq dars band qiling",
        'dashboard.hours_unit': 'soat',
        'dashboard.sessions_unit': 'ta seans',
        'dashboard.active_unit': 'ta faol',
        'dashboard.level': 'Level :level',
        'dashboard.streak': '🔥 :count kunlik seriya!',

        'dashboard.teacher_title': "O'qituvchi boshqaruv paneli",
        'dashboard.teacher_subtitle':
            "Xush kelibsiz, :name. Darslaringiz va bo'sh vaqtlaringizni boshqaring.",
        'dashboard.manage_availability': "Bo'sh vaqtlarni boshqarish",
        'dashboard.google_not_connected': 'Google kalendar ulanmagan',
        'dashboard.google_not_connected_desc':
            'Darslaringiz uchun Google Meet havolalarini avtomatik yaratish uchun Google hisobingizni ulang.',
        'dashboard.connect_google': 'Google hisobni ulash',
        'dashboard.sessions_today': 'Bugungi darslar',
        'dashboard.sessions_today_desc': 'Bugungi tasdiqlangan darslar soni',
        'dashboard.total_pupils': "Jami o'quvchilar",
        'dashboard.total_pupils_desc': "Siz dars o'tgan o'quvchilar",
        'dashboard.your_rating': 'Sizning bahoingiz',
        'dashboard.your_rating_desc': "O'quvchilar baholariga ko'ra",
        'dashboard.todays_schedule': 'Bugungi jadval',
        'dashboard.no_appointments_today':
            'Bugun uchun tasdiqlangan darslar mavjud emas.',
        'dashboard.no_appointments_today_desc':
            'Bugun uchun tasdiqlangan dars seanslari hali rejalashtirilmagan.',
        'dashboard.view_calendar': "Jadval taqvimini ko'rish",
        'dashboard.check_history': 'Tarixni tekshirish',
        'teacher.booking_requests_empty_desc':
            "Talabalarning dars band qilish so'rovlari yuborilgandan keyin shu yerda ko'rinadi.",
        'schedule.empty_desc':
            "Sizning kun tartibingizda rejalashtirilgan dars seanslari yo'q.",
        'teacher.sessions_empty_desc':
            "Sizning fikr-mulohazangiz bilan yakunlangan darslar shu yerda ko'rinadi.",
        'teacher.feedback_empty_desc':
            "Talabalarning fikr-mulohazalari yuborilgandan keyin shu yerda ko'rinadi.",
        'sessions.empty_desc': "Sizda o'tgan yakunlangan dars seanslari yo'q.",
        'Intermediate Speaking': 'Intermediate darajadagi gapirish',
        'dashboard.pending_feedback': 'Kutilayotgan fikr-mulohazalar',
        'dashboard.all_caught_up': 'Barcha ishlar bajarildi!',
        'dashboard.all_caught_up_desc':
            "Siz barcha o'tgan darslaringiz uchun fikr yozgansiz. Barakalla!",
        'dashboard.cancel_conversation_confirm':
            'Ushbu suhbatni bekor qilishni xohlaysizmi?',
        'dashboard.cancel_conversation_success':
            'Suhbat muvaffaqiyatli bekor qilindi',
        'dashboard.cancel_conversation_error':
            'Suhbatni bekor qilishda xatolik yuz berdi',
        'dashboard.start_conversation_success':
            'Suhbat boshlandi! Havola ochilmoqda...',
        'dashboard.start_conversation_error':
            'Suhbatni boshlashda xatolik yuz berdi',
        'teacher.feedback_title': "O'quvchilar fikri",
        'teacher.feedback_desc':
            "O'quvchilaringiz darslar haqida nima deyayotganini va ular uchun yozilgan fikrlarni ko'ring.",
        'teacher.no_feedback':
            'Hozircha hech qanday fikr-mulohaza kelib tushmadi.',
        'teacher.feedback_author': 'Muallif',
        'teacher.feedback_role_pupil': "O'quvchi",
        'teacher.feedback_role_teacher': "O'qituvchi (Siz)",
        'teacher.feedback_target': 'Kim uchun',
        'teacher.feedback_session_info': 'Tegishli dars',
        'teacher.feedback_date': 'Sana',
        'teacher.feedback_time': 'Vaqt',
        'teacher.feedback_anonymous': "Noma'lum o'quvchi",
        'teacher.appointments_title': 'Darslarni boshqarish',
        'teacher.booking_requests': "Bandlik so'rovlari",
        'teacher.booking_requests_desc':
            "Kelgusi darslaringizni va tasdiqlash so'rovlarini boshqaring.",
        'teacher.approve': 'Tasdiqlash',
        'teacher.reject': 'Rad etish',
        'teacher.cancel': 'Bekor qilish',
        'teacher.no_appointments': "Dars band qilish so'rovlari topilmadi.",
        'teacher.loading': 'Yuklanmoqda...',
        'teacher.failed_load': "Bandlik so'rovlarini yuklash amalga oshmadi",
        'teacher.approve_success': 'Uchrashuv muvaffaqiyatli tasdiqlandi',
        'teacher.reject_success': 'Uchrashuv muvaffaqiyatli rad etildi',
        'teacher.approve_failed': 'Uchrashuvni tasdiqlashda xatolik yuz berdi',
        'teacher.reject_failed': 'Uchrashuvni rad etishda xatolik yuz berdi',
        'teacher.confirm_cancel':
            'Haqiqatan ham ushbu darsni bekor qilmoqchimisiz?',
        'teacher.cancel_success': 'Dars muvaffaqiyatli bekor qilindi',
        'schedule.title': 'Mening jadvalim',
        'schedule.desc': 'Kelgusi tasdiqlangan darslaringiz.',
        'schedule.scheduled': 'Rejalashtirilgan',
        'schedule.starting': 'Boshlanmoqda...',
        'schedule.join': "Darsga qo'shilish",
        'schedule.start': 'Darsni boshlash',
        'schedule.none': "Kelgusi rejalashtirilgan darslar yo'q.",
        'schedule.confirm_cancel':
            'Haqiqatan ham ushbu darsni bekor qilmoqchimisiz?',
        'schedule.cancel_success': 'Dars muvaffaqiyatli bekor qilindi',
        'schedule.cancel_failed': 'Darsni bekor qilishda xatolik yuz berdi',
        'schedule.start_success':
            'Dars boshlandi! Uchrashuv havolasi ochilmoqda...',
        'schedule.start_failed': 'Darsni boshlashda xatolik yuz berdi',
        'teacher.sessions_title': 'Mening darslarim',
        'teacher.sessions_desc':
            "O'tgan va kelgusi o'qitish darslaringiz tarixi.",
        'teacher.sessions_leave_feedback': 'Fikr qoldirish',
        'teacher.sessions_feedback_left': 'Fikr bildirilgan',
        'teacher.sessions_your_feedback': "Ushbu dars bo'yicha fikringiz",
        'teacher.sessions_none': 'Darslar topilmadi.',
        'teacher.sessions_dialog_title': "O'quvchi uchun fikr qoldirish",
        'teacher.sessions_dialog_desc':
            ":name ning ingliz tilidagi natijalari va yaxshilash kerak bo'lgan jihatlari haqida fikr yozing.",
        'teacher.sessions_feedback_notes': 'Fikr-mulohaza / Dars eslatmalari',
        'teacher.sessions_feedback_placeholder':
            "O'quvchining darsdagi faolligini tasvirlab bering. Suhbat tezligi, talaffuz va lug'at bo'yicha tavsiyalarga e'tibor qarating...",

        'dashboard.speaking_practice': 'Ingliz tilida gapirish amaliyoti',
        'dashboard.conversation_practice': 'Ingliz tilida suhbat amaliyoti',
        'dashboard.with_pupil': ':name bilan',
        'dashboard.with_teacher': "O'qituvchi :name bilan",
        'teachers.browse': "O'qituvchilarni qidirish",
        'teachers.meet_expert':
            "Bizning malakali o'qituvchilarimiz bilan tanishing",
        'teachers.subtitle':
            'Sertifikatlangan mutaxassis bilan 1 ga 1 dars band qiling.',
        'teachers.none_available': "Hozirda bo'sh o'qituvchilar mavjud emas.",
        'teachers.certified': 'Sertifikatlangan',
        'teachers.speaking': 'Speaking: :band',
        'teachers.years_experience': ':count yillik tajriba',
        'teachers.reviews_count': ':count ta sharh',
        'teachers.book_session': 'Dars band qilish',
        'teachers.view_profile': "Profilni ko'rish",
        'teachers.profile_title': "O'qituvchi profili",
        'teachers.workplace': 'Ish joyi',
        'teachers.age': 'Yoshi',
        'teachers.certificates': 'Sertifikatlar',
        'teachers.no_certificates': 'Sertifikatlar yuklanmagan.',
        'teachers.feedback_title': "O'quvchilar fikri",
        'teachers.no_feedback': "Hozircha hech qanday fikr-mulohazalar yo'q.",
        'teachers.book_now': 'Dars band qilish',
        'labels.title': "Dars turlari / Yo'nalishlar",
        'labels.mock': 'Mock suhbat / Test',
        'labels.freestyle': 'Erkin suhbat',
        'labels.lessons': 'Tizimli darslar',
        'labels.business english': 'Biznes ingliz tili',
        'labels.practice q&a': 'Mashq Q&A',
        'bookings.title': 'Mening buyurtmalarim',
        'bookings.desc':
            "Kelgusi va kutilayotgan dars so'rovlaringizni boshqaring.",
        'bookings.teacher_label': "O'qituvchi: :name",
        'bookings.none': 'Siz hali dars band qilmagansiz.',
        'bookings.none_desc':
            "Boshlash uchun sertifikatlangan o'qituvchilarimizdan biri bilan gaplashish darsini rejalashtiring.",
        'bookings.status_confirmed': 'Tasdiqlangan',
        'bookings.status_pending': 'Kutilmoqda',
        'bookings.status_cancelled': 'Bekor qilingan',
        'bookings.delete': "O'chirish",
        'bookings.delete_confirm':
            "Ushbu dars haqidagi ma'lumotni o'chirishni xohlaysizmi?",
        'bookings.delete_success':
            "Dars haqidagi ma'lumot muvaffaqiyatli o'chirildi",
        'bookings.delete_error':
            "Dars ma'lumotini o'chirishda xatolik yuz berdi",
        'sessions.past_title': "O'tgan darslar",
        'sessions.past_desc':
            'Tugallangan ingliz tili amaliy darslaringiz tarixi.',
        'sessions.leave_feedback': 'Fikr bildirish',
        'sessions.feedback_left': 'Fikr bildirilgan',
        'sessions.your_review': 'Sizning fikringiz',
        'sessions.none': "O'tgan darslar topilmadi.",
        'sessions.rating_label': 'Darsni baholash (:score/10)',
        'sessions.comments_label': 'Sizning izohingiz',
        'sessions.comments_placeholder':
            "Darsingizni tasvirlab bering. O'qituvchining tempi, aniqligi va foydaliligi qanday edi?",
        'sessions.submitting': 'Yuborilmoqda...',
        'sessions.submit_btn': 'Fikrni yuborish',
        'sessions.dialog_desc':
            ":name bilan o'tgan darsingiz haqidagi fikringizni ulashing.",
        'progress.title': 'Mening yutuqlarim',
        'progress.desc':
            "O'quv jarayoningiz va so'zlashuv malakangiz o'sishini kuzatib boring.",
        'progress.path': "Yo'nalish",
        'progress.sessions': 'Darslar',
        'progress.rating': 'Reyting',
        'progress.certificates': 'Sertifikatlar',
        'progress.earned': ':count ta olingan',
        'progress.keep_practicing': 'Mashq qilishda davom eting!',
        'progress.keep_practicing_desc':
            "Gapirish mahoratingiz yaxshilanmoqda. Erkinlik va aniqlik darajangizni oshirish uchun ko'proq dars band qiling.",
        'progress.lessons_count': '/ :count ta dars',
        'progress.rating_count': '/ 5.0 baho',
        'progress.completion_title': 'O‘quv jarayonining bajarilishi',
        'progress.completion_desc':
            'ConvoMate-da rejalashtirilgan :total ta darsdan :completed tasi yakunlandi.',
        'profile.title': 'Profil',
        'profile.desc': 'Ismingiz va email manzilingizni yangilang',
        'profile.name': 'Ism',
        'profile.fullname_placeholder': "To'liq ismingiz",
        'profile.email': 'Email manzil',
        'profile.teacher_info': "O'qituvchi profili ma'lumotlari",
        'profile.teacher_desc':
            "Sertifikatlaringiz, IELTS ballaringiz va ish tajribangiz haqida ma'lumot bering.",
        'profile.age': 'Yosh',
        'profile.phone': 'Telefon raqam',
        'profile.overall': 'Umumiy IELTS darajasi / Baho',
        'profile.speaking': 'Speaking (Gapirish) balli',
        'profile.experience': 'Tajriba yillari',
        'profile.workplace': 'Hozirgi ish joyi / Muassasa',
        'profile.certificates': 'Sertifikatlar (Vergul bilan ajratilgan)',
        'profile.pupil_info': "O'quvchi profili ma'lumotlari",
        'profile.pupil_desc':
            "O'qituvchilar darslarni sizning darajangizga moslashtirishi uchun profilingizni to'ldiring.",
        'profile.target_level': 'Ingliz tilidagi maqsadli daraja',
        'profile.select_level': 'Darajani tanlang',
        'profile.email_unverified': 'Sizning email manzilingiz tasdiqlanmagan.',
        'profile.resend_btn':
            'Tasdiqlash xatini qayta yuborish uchun bu yerga bosing.',
        'profile.resend_sent':
            'Yangi tasdiqlash havolasi email manzilingizga yuborildi.',
        'profile.save': 'Saqlash',
        'profile.level_beginner': "Beginner (Boshlang'ich)",
        'profile.level_pre_int': 'Pre-Intermediate',
        'profile.level_upper_int': 'Upper-Intermediate',
        'profile.level_advanced': 'Advanced (Yuqori)',
        'profile.level_ielts': 'IELTS Band',
        'profile.level_cefr': 'CEFR Band',
        'security.title': 'Xavfsizlik sozlamalari',
        'security.update_password': 'Parolni yangilash',
        'security.update_password_desc':
            "Hisobingiz xavfsizligini ta'minlash uchun uzun va tasodifiy paroldan foydalaning",
        'security.current_password': 'Joriy parol',
        'security.new_password': 'Yangi parol',
        'security.confirm_password': 'Parolni tasdiqlang',
        'appearance.title': 'Mavzu sozlamalari',
        'appearance.desc':
            "Hisobingiz uchun mavzu va ko'rinish sozlamalarini yangilang",
        'appearance.light': "Yorug'",
        'appearance.dark': "Qorong'u",
        'appearance.system': 'Tizim',
    },
    ru: {
        // common / layout
        'nav.dashboard': 'Панель управления',
        'nav.booking_requests': 'Запросы на бронирование',
        'nav.my_schedule': 'Моё расписание',
        'nav.availability': 'Моя доступность',
        'nav.my_sessions': 'Мои уроки',
        'nav.pupil_feedback': 'Отзывы учеников',
        'nav.users': 'Пользователи',
        'nav.all_sessions': 'Все сессии',
        'nav.find_teachers': 'Найти преподавателя',
        'nav.my_bookings': 'Мои бронирования',
        'nav.past_sessions': 'Прошедшие уроки',
        'nav.my_progress': 'Мой прогресс',
        'nav.logout': 'Выйти',
        'nav.profile': 'Профиль',
        'nav.settings': 'Настройки',

        // settings
        'settings.title': 'Настройки',
        'settings.subtitle': 'Управляйте настройками своего аккаунта.',
        'settings.profile': 'Профиль',
        'settings.security': 'Безопасность',
        'settings.appearance': 'Оформление',
        'settings.save': 'Сохранить',
        'settings.saved': 'Сохранено.',

        // welcome / landing
        'welcome.nav_features': 'Возможности',
        'welcome.nav_how_it_works': 'Как это работает',
        'welcome.nav_teachers': 'Преподаватели',
        'welcome.nav_pricing': 'Цены',
        'welcome.badge': '#1 Языковая платформа в рейтинге',
        'welcome.title': 'Говорите по-английски',
        'welcome.title_fluently': 'Свободно',
        'welcome.title_with_teachers': 'с экспертными преподавателями',
        'welcome.one_on_one': '1 на 1',
        'welcome.title_today': 'Сегодня',
        'welcome.view_teachers': 'Посмотреть учителей',
        'welcome.subtitle':
            'Бронируйте индивидуальные уроки с сертифицированными преподавателями. Практируйте общение, получайте мгновенные отзывы и отслеживайте прогресс — всё через Google Meet.',
        'welcome.get_started': 'Начать',
        'welcome.cta_start': 'Начните говорить сегодня',
        'welcome.cta_how_it_works': 'Как это работает',
        'welcome.trust_learners': '2500+ активных студентов',
        'welcome.trust_rating': 'Средняя оценка 4.9/5',
        'welcome.trust_experts': 'Сертифицированные эксперты IELTS',
        'welcome.features_title': 'Всё, что нужно для',
        'welcome.features_title_highlight': 'улучшения',
        'welcome.features_subtitle':
            'Полная платформа, разработанная для серьезных студентов, нацеленных на реальный результат',
        'welcome.feature_1_title': 'Живые уроки 1 на 1',
        'welcome.feature_1_desc':
            'Подключайтесь к преподавателям через Google Meet для интерактивной разговорной практики в реальном времени.',
        'welcome.feature_2_title': 'Умное расписание',
        'welcome.feature_2_desc':
            'Бронируйте уроки на основе свободного времени учителя. Синхронизация календаря исключает накладки.',
        'welcome.feature_3_title': 'Сертифицированные учителя',
        'welcome.feature_3_desc':
            'Все преподаватели имеют сертификаты IELTS/CEFR с подтвержденным баллом по говорению.',
        'welcome.feature_4_title': 'Мгновенная обратная связь',
        'welcome.feature_4_desc':
            'Получайте подробный отзыв о произношении, грамматике и беглости речи после каждого урока.',
        'welcome.feature_5_title': 'Отслеживание прогресса',
        'welcome.feature_5_desc':
            'Отслеживайте свои улучшения с помощью подробной статистики и записей уроков.',
        'welcome.feature_6_title': 'Любой уровень подготовки',
        'welcome.feature_6_desc':
            'От новичка до продвинутого — преподаватели подстраиваются под ваш уровень и цели.',
        'welcome.how_title': 'Начните говорить за',
        'welcome.how_title_highlight': '3 шага',
        'welcome.how_subtitle': 'Начать работу быстро и просто',
        'welcome.how_step_1_title': 'Создайте аккаунт',
        'welcome.how_step_1_desc':
            'Зарегистрируйтесь как студент, выберите уровень английского и укажите свои цели.',
        'welcome.how_step_2_title': 'Найдите и забронируйте',
        'welcome.how_step_2_desc':
            'Найдите сертифицированных учителей по рейтингу, доступности и специализации. Забронируйте урок.',
        'welcome.how_step_3_title': 'Начните говорить',
        'welcome.how_step_3_desc':
            'Подключитесь к Google Meet, практикуйте речь и получайте отзывы для улучшения.',
        'welcome.teachers_title': 'Встречайте наших',
        'welcome.teachers_title_highlight': 'экспертных учителей',
        'welcome.teachers_subtitle':
            'Опытные, сертифицированные и стремящиеся помочь вам совершенствоваться',
        'welcome.teachers_experience': 'опыта',
        'welcome.pricing_title': 'Простые',
        'welcome.pricing_title_highlight': 'Цены',
        'welcome.pricing_subtitle':
            'Выберите план, соответствующий вашим целям обучения',
        'welcome.pricing_most_popular': 'Самый популярный',
        'welcome.pricing_free': 'Бесплатно',
        'welcome.pricing_month': '/мес',
        'welcome.pricing_plan_starter_desc':
            'Идеально, чтобы попробовать платформу',
        'welcome.pricing_plan_pro_desc': 'Для серьезных учеников',
        'welcome.pricing_plan_unlimited_desc': 'Максимум времени для практики',
        'welcome.pricing_plan_starter_feat_1': '1 бесплатный урок в месяц',
        'welcome.pricing_plan_starter_feat_2': 'Просмотр профилей учителей',
        'welcome.pricing_plan_starter_feat_3': 'Базовое отслеживание прогресса',
        'welcome.pricing_plan_pro_feat_1': '8 уроков в месяц',
        'welcome.pricing_plan_pro_feat_2': 'Приоритетное бронирование',
        'welcome.pricing_plan_pro_feat_3': 'Подробные отчеты о результатах',
        'welcome.pricing_plan_pro_feat_4': 'Записи занятий',
        'welcome.pricing_plan_pro_feat_5': 'Аналитика прогресса',
        'welcome.pricing_plan_unlimited_feat_1': 'Безлимитные уроки',
        'welcome.pricing_plan_unlimited_feat_2': 'Все возможности Pro плана',
        'welcome.pricing_plan_unlimited_feat_3': 'Приоритетная поддержка',
        'welcome.pricing_plan_unlimited_feat_4':
            'Материалы для подготовки к IELTS',
        'welcome.pricing_plan_unlimited_feat_5': 'Доступ к групповым занятиям',
        'welcome.pricing_plan_starter_cta': 'Начать бесплатно',
        'welcome.pricing_plan_pro_cta': 'Получить Pro',
        'welcome.pricing_plan_unlimited_cta': 'Перейти на Безлимитный',
        'welcome.cta_ready': 'Готовы начать говорить?',
        'welcome.cta_sub':
            'Присоединяйтесь к тысячам студентов, улучшающих свой английский каждый день.',
        'welcome.cta_btn': 'Создать бесплатный аккаунт',
        'welcome.footer_rights': 'Все права защищены.',
        'welcome.home_bento_title': 'Всё, что нужно для освоения английского',
        'welcome.home_bento_subtitle':
            'Разработано для профессионалов и тех, кто ценит качество и эффективность.',
        'welcome.home_bento_1_title': 'Анализ разговора с помощью ИИ',
        'welcome.home_bento_1_desc':
            'Наша система анализирует ваше произношение и грамматику во время занятий, мгновенно предоставляя отчет.',
        'welcome.home_bento_1_accuracy': 'ТОЧНОСТЬ 94%',
        'welcome.home_bento_2_title': 'Гибкое расписание',
        'welcome.home_bento_2_desc':
            'Бронируйте занятия 24/7 в любом часовом поясе. Обучение никогда не останавливается.',
        'welcome.home_bento_3_title': 'Поиск тем',
        'welcome.home_bento_3_desc':
            'Выбирайте из более чем 500 тем — от технологий до повседневных идиом.',
        'welcome.home_bento_4_title': 'Интеграция с Google Meet',
        'welcome.home_bento_4_desc':
            'Не нужно устанавливать новые программы. Используйте знакомые и любимые инструменты для занятий.',
        'welcome.features_hero_title': 'Всё, что вам нужно для улучшения',
        'welcome.features_hero_subtitle':
            'Полная платформа, созданная для серьезных студентов, желающих достичь результатов за счет погружения и помощи экспертов.',
        'welcome.features_pers_learning': 'ПЕРСОНАЛИЗИРОВАННОЕ ОБУЧЕНИЕ',
        'welcome.features_journey_title':
            'Ваш путь обучения, разработанный экспертами.',
        'welcome.features_journey_desc':
            'Мы не верим в универсальные решения. ConvoMate анализирует вашу речь, чтобы подобрать преподавателей, специализирующихся на ваших точках роста.',
        'welcome.features_journey_item_1':
            'Модули для прицельного уменьшения акцента',
        'welcome.features_journey_item_2':
            'Специализированные курсы делового английского',
        'welcome.features_journey_item_3':
            'Подготовка к экзаменам (IELTS, TOEFL, Cambridge)',
        'welcome.features_cta_ready': 'Готовы заговорить свободно?',
        'welcome.features_cta_sub':
            'Присоединяйтесь к более чем 50 000 студентов, которые обрели уверенность и улучшили карьерные перспективы с ConvoMate.',
        'welcome.features_cta_btn': 'Начать бесплатный период',
        'welcome.how_badge': 'ПРОСТОЙ ПУТЬ',
        'welcome.how_step_1_title_new': 'Создайте аккаунт',
        'welcome.how_step_1_desc_new':
            'Зарегистрируйтесь как студент, выберите уровень английского и укажите свои цели менее чем за две минуты.',
        'welcome.how_step_2_title_new': 'Найдите и забронируйте',
        'welcome.how_step_2_desc_new':
            'Найдите сертифицированных учителей по рейтингу, доступности и специализации. Забронируйте урок.',
        'welcome.how_step_3_title_new': 'Начните говорить',
        'welcome.how_step_3_desc_new':
            'Подключитесь к Google Meet, практикуйте речь с репетитором и получайте мгновенные отзывы для улучшения.',
        'welcome.how_cta_ready': 'Готовы заговорить уверенно?',
        'welcome.how_cta_sub':
            'Присоединяйтесь к тысячам студентов, которые улучшили беглость речи благодаря индивидуальному подходу ConvoMate.',
        'welcome.teachers_hero_title': 'Учитесь у лучших преподавателей мира',
        'welcome.teachers_hero_subtitle':
            'Опытные, сертифицированные и стремящиеся помочь вам улучшить разговорные навыки.',
        'welcome.teachers_search_placeholder': 'Поиск по имени или навыку',
        'welcome.teachers_all_specialties': 'Все направления',
        'welcome.teachers_ielts_prep': 'Подготовка к IELTS',
        'welcome.teachers_business_english': 'Деловой английский',
        'welcome.teachers_kids_teens': 'Дети и подростки',
        'welcome.teachers_sarah_desc':
            'Специализируется на продвинутых разговорных техниках и подготовке к экзаменам более 5 лет.',
        'welcome.teachers_james_desc':
            'Эксперт в деловом общении и проведении корпоративных воркшопов. Помогу вам звучать как лидер.',
        'welcome.teachers_emma_desc':
            'С большим удовольствием обучаю детей и тех, кто начинает учить английский с нуля.',
        'welcome.teachers_become_teacher': 'Стать преподавателем',
        'welcome.teachers_become_desc':
            'Присоединяйтесь к нашей глобальной сети элитных преподавателей и зарабатывайте в удобное время.',
        'welcome.teachers_apply_now': 'Подать заявку',
        'welcome.teachers_cta_ready': 'Готовы начать свой путь?',
        'welcome.teachers_cta_sub':
            'Получите первое бесплатное занятие с любым преподавателем на этой неделе. Без обязательств.',
        'welcome.teachers_cta_btn': 'Забронировать бесплатный урок',

        // Auth pages
        'auth.login': 'Войти',
        'auth.register': 'Регистрация',
        'auth.email': 'Электронная почта',
        'auth.email_address': 'Адрес эл. почты',
        'auth.password': 'Пароль',
        'auth.remember_me': 'Запомнить меня',
        'auth.forgot_password': 'Забыли пароль?',
        'auth.no_account': 'Нет аккаунта?',
        'auth.registering_with_google': 'Регистрация через Google:',
        'auth.has_account': 'Уже зарегистрированы?',
        'auth.full_name': 'ФИО',
        'auth.name': 'Имя',
        'auth.full_name_placeholder': 'Полное имя',
        'auth.confirm_password': 'Подтвердите пароль',
        'auth.role': 'Тип регистрации',
        'auth.role_pupil': 'Ученик (Студент)',
        'auth.role_teacher': 'Учитель (Преподаватель)',
        'auth.register_button': 'Создать аккаунт',
        'auth.login_button': 'Войти',
        'auth.age': 'Возраст',
        'auth.age_placeholder': 'Введите ваш возраст',
        'auth.phone_number': 'Номер телефона',
        'auth.target_level': 'Целевой уровень английского',
        'auth.select_level': 'Выберите уровень',
        'auth.overall_level': 'Общий уровень IELTS',
        'auth.speaking_band': 'Балл за говорение',
        'auth.sign_up': 'Зарегистрироваться',
        'auth.create_account_title': 'Создать аккаунт',
        'auth.create_account_desc':
            'Введите свои данные ниже, чтобы создать аккаунт',
        'auth.login_title': 'Войти в свой аккаунт',
        'auth.login_desc':
            'Введите адрес электронной почты и пароль ниже для входа',
        'auth.join_as': 'Зарегистрироваться как',
        'auth.pupil_desc': 'Бронировать разговорные уроки',
        'auth.teacher_desc': 'Преподавать и вести расписание',
        'auth.continue_with_google': 'Continue with Google',

        // Pupil booking / teachers list
        'pupil.find_teachers': 'Найти учителя',
        'pupil.no_teachers': 'Учителя не найдены.',
        'pupil.book_button': 'Забронировать сессию',
        'pupil.select_date': 'Выберите дату',
        'pupil.select_slot': 'Выберите свободное время',
        'pupil.custom_time': 'Или запросите индивидуальное время',
        'pupil.custom_start': 'Время начала',
        'pupil.custom_end': 'Время окончания',
        'pupil.custom_book': 'Запросить время',

        // booking page
        'booking.title': 'Забронировать урок',
        'booking.subtitle':
            'Зарезервируйте время для практического занятия с :name',
        'booking.today': 'Сегодня',
        'booking.day': 'День',
        'booking.week': 'Неделя',
        'booking.custom_title': 'Или запросите индивидуальное время',
        'booking.confirm_title': 'Подтверждение запроса на бронирование',
        'booking.confirm_message':
            'Вы уверены, что хотите отправить запрос на бронирование преподавателю :teacher на период с :start по :end?',
        'booking.all_time_title': 'Выбор гибкого времени',
        'booking.all_time_desc':
            'Пожалуйста, выберите конкретное время начала и окончания в пределах диапазона доступности преподавателя.',
        'booking.all_time_start': 'Время начала',
        'booking.all_time_end': 'Время окончания',
        'booking.invalid_range':
            'Недопустимый диапазон времени: время окончания должно быть позже времени начала и находиться в пределах доступного блока.',
        'booking.confirm_btn': 'Подтвердить запрос',
        'booking.cancel_btn': 'Отмена',
        'booking.requesting': 'Отправка...',
        'booking.success':
            'Сессия забронирована! Ожидание подтверждения преподавателя.',
        'booking.custom_success':
            'Индивидуальная сессия запрошена! Ожидание подтверждения преподавателя.',
        'booking.failed': 'Ошибка бронирования',
        'booking.no_slots': 'Нет свободных слотов на эту дату.',
        'booking.custom_start': 'Время начала',
        'booking.custom_end': 'Время окончания',
        'booking.custom_submit': 'Запросить индивидуальную сессию',
        'booking.ielts_level': 'Уровень IELTS',
        'booking.speaking_band': 'Балл за говорение',
        'booking.experience': 'Опыт работы',
        'booking.rating': 'Рейтинг',
        'booking.years': 'лет',
        'booking.workplace': 'Место работы',
        'booking.age': 'Возраст',
        'booking.phone': 'Телефон',
        'booking.certificates': 'Сертификаты',
        'booking.instant_sync_title': 'Мгновенная синхронизация',
        'booking.instant_sync_desc':
            'Слоты исчезают мгновенно по мере бронирования другими студентами. Вы видите живое расписание.',
        'booking.show_sidebar': 'Выбрать дату',
        'booking.hide_sidebar': 'Скрыть',

        // Pupil Progress
        'pupil.progress_title': 'Мой прогресс',
        'pupil.progress_desc':
            'Следите за своим прогрессом и отзывами учителей.',
        'pupil.total_sessions': 'Всего уроков',
        'pupil.avg_rating': 'Средняя оценка',
        'pupil.feedback_history': 'История отзывов',
        'pupil.no_feedback': 'Отзывов пока нет.',

        // Meeting states
        'meeting.scheduled': 'Запланировано',
        'meeting.join': 'Войти в класс',
        'meeting.start': 'Начать урок',
        'meeting.not_ready': 'Учитель еще не готов!',
        'meeting.starting': 'Запуск...',

        // Dashboard
        'dashboard.welcome_back': 'С возвращением, :name 👋',
        'dashboard.learning_journey_desc':
            'Вот что происходит с вашим обучением.',
        'dashboard.speaking_hours': 'Часы практики',
        'dashboard.upcoming_sessions': 'Ближайшие уроки',
        'dashboard.avg_rating': 'Средний балл',
        'dashboard.rating_desc': 'Отзывы ваших преподавателей',
        'dashboard.no_upcoming': 'Нет подтвержденных предстоящих уроков.',
        'dashboard.no_upcoming_sub':
            'Ваша разговорная практика начинается здесь! Давайте вместе двигаться к вашим целям и покорять новые вершины.',
        'dashboard.book_now': 'Забронировать урок',
        'dashboard.recent_feedback': 'Последние отзывы',
        'dashboard.no_feedback': 'Отзывов пока не поступало.',
        'dashboard.cancel_booking_confirm':
            'Вы уверены, что хотите отменить это бронирование?',
        'dashboard.cancel_success': 'Бронирование успешно отменено',
        'dashboard.cancel_error': 'Не удалось отменить бронирование',
        'dashboard.cancel_button': 'Отмена',
        'dashboard.practice_perfect': 'Практика ведет к совершенству',
        'dashboard.book_more': 'Бронируйте больше для быстрого прогресса',
        'dashboard.hours_unit': 'ч.',
        'dashboard.sessions_unit': 'сеанс(ов)',
        'dashboard.active_unit': 'активно',
        'dashboard.level': 'Уровень :level',
        'dashboard.streak': '🔥 Серия дней: :count!',

        'dashboard.teacher_title': 'Панель преподавателя',
        'dashboard.teacher_subtitle':
            'С возвращением, :name. Управляйте своими уроками и доступностью.',
        'dashboard.manage_availability': 'Управление доступностью',
        'dashboard.google_not_connected': 'Google Календарь не подключен',
        'dashboard.google_not_connected_desc':
            'Пожалуйста, подключите свой Google аккаунт для автоматического создания ссылок Google Meet.',
        'dashboard.connect_google': 'Подключить Google аккаунт',
        'dashboard.sessions_today': 'Уроки на сегодня',
        'dashboard.sessions_today_desc': 'Подтвержденные уроки на сегодня',
        'dashboard.total_pupils': 'Всего учеников',
        'dashboard.total_pupils_desc': 'Ученики, которых вы обучали',
        'dashboard.your_rating': 'Ваш рейтинг',
        'dashboard.your_rating_desc': 'На основе отзывов учеников',
        'dashboard.todays_schedule': 'Расписание на сегодня',
        'dashboard.no_appointments_today':
            'На сегодня нет запланированных уроков.',
        'dashboard.no_appointments_today_desc':
            'На сегодня нет подтверждённых занятий.',
        'dashboard.view_calendar': 'Просмотр расписания',
        'dashboard.check_history': 'Проверить историю',
        'teacher.booking_requests_empty_desc':
            'Запросы студентов на бронирование уроков появятся здесь после отправки.',
        'schedule.empty_desc':
            'У вас нет запланированных занятий в расписании.',
        'teacher.sessions_empty_desc':
            'Завершённые занятия с вашими отзывами появятся здесь.',
        'teacher.feedback_empty_desc':
            'Отзывы от студентов появятся здесь после отправки.',
        'sessions.empty_desc': 'У вас нет завершённых занятий в прошлом.',
        'Intermediate Speaking': 'Intermediate Speaking',
        'dashboard.pending_feedback': 'Ожидает отзыва',
        'dashboard.all_caught_up': 'Всё сделано!',
        'dashboard.all_caught_up_desc':
            'Вы оставили отзывы обо всех прошедших уроках. Отличная работа!',
        'dashboard.cancel_conversation_confirm':
            'Вы уверены, что хотите отменить эту беседу?',
        'dashboard.cancel_conversation_success': 'Беседа успешно отменена',
        'dashboard.cancel_conversation_error': 'Не удалось отменить беседу',
        'dashboard.start_conversation_success':
            'Беседа началась! Открываем ссылку...',
        'dashboard.start_conversation_error': 'Не удалось начать беседу',
        'teacher.feedback_title': 'Отзывы учеников',
        'teacher.feedback_desc':
            'Посмотрите, что говорят ваши ученики о ваших сессиях, а также отзывы, оставленные для них.',
        'teacher.no_feedback': 'Отзывов пока не поступало.',
        'teacher.feedback_author': 'Автор',
        'teacher.feedback_role_pupil': 'Ученик',
        'teacher.feedback_role_teacher': 'Учитель (Вы)',
        'teacher.feedback_target': 'Отзыв для',
        'teacher.feedback_session_info': 'Связанная сессия',
        'teacher.feedback_date': 'Дата',
        'teacher.feedback_time': 'Время',
        'teacher.feedback_anonymous': 'Анонимный студент',
        'teacher.appointments_title': 'Управление уроками',
        'teacher.booking_requests': 'Запросы на бронирование',
        'teacher.booking_requests_desc':
            'Управляйте вашими предстоящими занятиями и запросами на подтверждение.',
        'teacher.approve': 'Одобрить',
        'teacher.reject': 'Отклонить',
        'teacher.cancel': 'Отменить',
        'teacher.no_appointments':
            'Запросов на бронирование уроков не найдено.',
        'teacher.loading': 'Загрузка...',
        'teacher.failed_load': 'Не удалось загрузить бронирования',
        'teacher.approve_success': 'Урок успешно подтвержден',
        'teacher.reject_success': 'Урок успешно отклонен',
        'teacher.approve_failed': 'Не удалось подтвердить урок',
        'teacher.reject_failed': 'Не удалось отклонить урок',
        'teacher.confirm_cancel':
            'Вы уверены, что хотите отменить это бронирование?',
        'teacher.cancel_success': 'Бронирование успешно отменено',
        'schedule.title': 'Моё расписание',
        'schedule.desc': 'Ваши предстоящие подтвержденные занятия.',
        'schedule.scheduled': 'Запланировано',
        'schedule.starting': 'Запуск...',
        'schedule.join': 'Войти в урок',
        'schedule.start': 'Начать урок',
        'schedule.none': 'Предстоящих запланированных занятий не найдено.',
        'schedule.confirm_cancel':
            'Вы уверены, что хотите отменить это занятие?',
        'schedule.cancel_success': 'Занятие успешно отменено',
        'schedule.cancel_failed': 'Не удалось отменить занятие',
        'schedule.start_success':
            'Занятие начато! Открытие ссылки на встречу...',
        'schedule.start_failed': 'Не удалось начать занятие',
        'teacher.sessions_title': 'Мои уроки',
        'teacher.sessions_desc':
            'История ваших прошедших и предстоящих занятий.',
        'teacher.sessions_leave_feedback': 'Оставить отзыв',
        'teacher.sessions_feedback_left': 'Отзыв оставлен',
        'teacher.sessions_your_feedback': 'Ваш отзыв о занятии',
        'teacher.sessions_none': 'Занятий не найдено.',
        'teacher.sessions_dialog_title': 'Оставить отзыв об ученике',
        'teacher.sessions_dialog_desc':
            'Напишите отзыв об успеваемости ученика :name в английском языке и областях для улучшения.',
        'teacher.sessions_feedback_notes': 'Отзыв / Заметки к уроку',
        'teacher.sessions_feedback_placeholder':
            'Опишите успехи ученика. Обратите внимание на беглость речи, произношение и рекомендации по словарному запасу...',

        'dashboard.speaking_practice': 'Практика английской разговорной речи',
        'dashboard.conversation_practice': 'Практика английского общения',
        'dashboard.with_pupil': 'с :name',
        'dashboard.with_teacher': 'с преподавателем :name',
        'teachers.browse': 'Поиск преподавателей',
        'teachers.meet_expert':
            'Познакомьтесь с нашими опытными преподавателями',
        'teachers.subtitle':
            'Забронируйте индивидуальное занятие с сертифицированным специалистом.',
        'teachers.none_available':
            'В данный момент нет доступных преподавателей.',
        'teachers.certified': 'Сертифицирован',
        'teachers.speaking': 'Speaking: :band',
        'teachers.years_experience': ':count лет опыта',
        'teachers.reviews_count': ':count отзывов',
        'teachers.book_session': 'Забронировать урок',
        'teachers.view_profile': 'Посмотреть профиль',
        'teachers.profile_title': 'Профиль преподавателя',
        'teachers.workplace': 'Место работы',
        'teachers.age': 'Возраст',
        'teachers.certificates': 'Сертификаты',
        'teachers.no_certificates': 'Сертификаты еще не загружены.',
        'teachers.feedback_title': 'Отзывы учеников',
        'teachers.no_feedback': 'Отзывов пока нет.',
        'teachers.book_now': 'Забронировать',
        'labels.title': 'Форматы занятий / Направления',
        'labels.mock': 'Пробный экзамен',
        'labels.freestyle': 'Разговорный клуб',
        'labels.lessons': 'Структурированные уроки',
        'labels.business english': 'Деловой английский',
        'labels.practice q&a': 'Практика Q&A',
        'bookings.title': 'Мои бронирования',
        'bookings.desc':
            'Управляйте вашими предстоящими и ожидающими запросами на уроки.',
        'bookings.teacher_label': 'Преподаватель: :name',
        'bookings.none': 'Вы еще не забронировали ни одного урока.',
        'bookings.none_desc':
            'Запланируйте практическое занятие с одним из наших сертифицированных преподавателей, чтобы начать.',
        'bookings.status_confirmed': 'Подтверждено',
        'bookings.status_pending': 'В ожидании',
        'bookings.status_cancelled': 'Отменено',
        'bookings.delete': 'Удалить запись',
        'bookings.delete_confirm':
            'Вы уверены, что хотите удалить эту запись о занятии?',
        'bookings.delete_success': 'Запись о занятии успешно удалена',
        'bookings.delete_error': 'Не удалось удалить запись о занятии',
        'sessions.past_title': 'Прошедшие уроки',
        'sessions.past_desc':
            'История ваших пройденных практических занятий по английскому языку.',
        'sessions.leave_feedback': 'Оставить отзыв',
        'sessions.feedback_left': 'Отзыв оставлен',
        'sessions.your_review': 'Ваш отзыв',
        'sessions.none': 'Прошедших уроков не найдено.',
        'sessions.rating_label': 'Оценка урока (:score/10)',
        'sessions.comments_label': 'Ваш комментарий',
        'sessions.comments_placeholder':
            'Опишите ваше занятие. Какими были темп, ясность и полезность преподавателя?',
        'sessions.submitting': 'Отправка...',
        'sessions.submit_btn': 'Отправить отзыв',
        'sessions.dialog_desc': 'Поделитесь своим мнением о занятии с :name.',
        'progress.title': 'Мой прогресс',
        'progress.desc':
            'Следите за своим процессом обучения и улучшением навыков разговорной речи.',
        'progress.path': 'Направление',
        'progress.sessions': 'Занятия',
        'progress.rating': 'Рейтинг',
        'progress.certificates': 'Сертификаты',
        'progress.earned': 'Получено: :count',
        'progress.keep_practicing': 'Продолжайте практиковаться!',
        'progress.keep_practicing_desc':
            'Ваша разговорная речь улучшается. Бронируйте больше занятий, чтобы повысить беглость и точность.',
        'progress.lessons_count': '/ :count уроков',
        'progress.rating_count': '/ 5.0 рейтинг',
        'progress.completion_title': 'Прогресс завершения обучения',
        'progress.completion_desc':
            'Завершено :completed из :total запланированных уроков на ConvoMate.',
        'profile.title': 'Профиль',
        'profile.desc': 'Обновите свое имя и адрес электронной почты',
        'profile.name': 'Имя',
        'profile.fullname_placeholder': 'Полное имя',
        'profile.email': 'Адрес электронной почты',
        'profile.teacher_info': 'Информация профиля преподавателя',
        'profile.teacher_desc':
            'Предоставьте информацию о ваших сертификатах, баллах IELTS и опыте работы.',
        'profile.age': 'Возраст',
        'profile.phone': 'Номер телефона',
        'profile.overall': 'Общий уровень IELTS / Оценка',
        'profile.speaking': 'Балл Speaking (Разговорный)',
        'profile.experience': 'Лет опыта',
        'profile.workplace': 'Текущее место работы / Учреждение',
        'profile.certificates': 'Сертификаты (через запятую)',
        'profile.pupil_info': 'Информация профиля ученика',
        'profile.pupil_desc':
            'Заполните данные профиля, чтобы преподаватели могли адаптировать уроки под ваш уровень.',
        'profile.target_level': 'Целевой уровень английского',
        'profile.select_level': 'Выберите уровень',
        'profile.email_unverified':
            'Ваш адрес электронной почты не подтвержден.',
        'profile.resend_btn':
            'Нажмите здесь, чтобы повторно отправить письмо для подтверждения.',
        'profile.resend_sent':
            'Новая ссылка для подтверждения была отправлена на ваш адрес электронной почты.',
        'profile.save': 'Сохранить',
        'profile.level_beginner': 'Beginner (Начальный)',
        'profile.level_pre_int': 'Pre-Intermediate',
        'profile.level_upper_int': 'Upper-Intermediate',
        'profile.level_advanced': 'Advanced (Продвинутый)',
        'profile.level_ielts': 'IELTS Band',
        'profile.level_cefr': 'CEFR Band',
        'security.title': 'Настройки безопасности',
        'security.update_password': 'Обновить пароль',
        'security.update_password_desc':
            'Убедитесь, что ваш аккаунт использует длинный и случайный пароль для безопасности',
        'security.current_password': 'Текущий пароль',
        'security.new_password': 'Новый пароль',
        'security.confirm_password': 'Подтвердите пароль',
        'appearance.title': 'Настройки оформления',
        'appearance.desc': 'Обновите настройки внешнего вида вашего аккаунта',
        'appearance.light': 'Светлая',
        'appearance.dark': 'Тёмная',
        'appearance.system': 'Системная',
    },
};

export function useTranslation() {
    const page = usePage<any>();
    const locale = page.props.locale || 'en';

    const t = (key: string, replacements?: Record<string, string | number>) => {
        const langDict =
            dictionary[locale as 'en' | 'uz' | 'ru'] || dictionary.en;
        let text = langDict[key as keyof typeof langDict] || key;

        if (replacements) {
            Object.entries(replacements).forEach(([k, v]) => {
                text = text.replace(`:${k}`, String(v));
            });
        }

        return text;
    };

    const setLanguage = (newLang: 'en' | 'uz' | 'ru') => {
        document.cookie = `locale=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        router.flushAll();
        router.reload();
    };

    return { t, locale, setLanguage };
}
