import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/use-translation';
import {
    Star,
    Video,
    User,
    Award,
    FileText,
    MessageCircle,
    Calendar,
    Clock,
    X,
    Info,
    Check,
    Sparkles,
    Loader2,
    ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Feedback {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    author?: {
        full_name: string;
        avatar?: string;
    };
}

interface Teacher {
    id: string;
    full_name: string;
    avatar?: string;
    gender?: string;
    email_verified_at?: string;
    teacher_profile?: {
        overall_level: string;
        speaking_band?: string | number;
        experience_years: string | number;
        workplace?: string;
        age?: number;
        certificates?: any;
        rating_cache: number;
        labels?: string[];
        headline?: string;
        bio?: string;
        intro_video_url?: string;
        price?: number;
        is_verified?: boolean;
        is_approved?: boolean;
    };
    feedbacks?: Feedback[];
}

interface Props {
    teacher: Teacher;
    hasEligibleTrial?: boolean;
    trialPrice?: number;
}

export default function TeacherProfile({ teacher, hasEligibleTrial = true, trialPrice }: Props) {
    const { auth } = usePage<any>().props;
    const { t } = useTranslation();

    const [lessonType, setLessonType] = React.useState<'trial' | 'full'>(hasEligibleTrial ? 'trial' : 'full');
    const [selectedDuration, setSelectedDuration] = React.useState<number>(60);

    // Raw certificates normalization
    const rawCerts = teacher.teacher_profile?.certificates ?? [];
    const normalizedCerts = React.useMemo(() => {
        if (!rawCerts) return [];
        const certsArray = typeof rawCerts === 'string' ? JSON.parse(rawCerts) : rawCerts;
        return (Array.isArray(certsArray) ? certsArray : []).map((c: any) => {
            if (typeof c === 'string') {
                const isUrl = c.startsWith('http') || c.startsWith('/storage');
                return {
                    type: 'ielts',
                    custom_type_name: '',
                    title: isUrl ? 'IELTS Certificate' : c,
                    overall: '',
                    listening: '',
                    reading: '',
                    writing: '',
                    speaking: '',
                    file_url: isUrl ? c : null,
                    file_name: isUrl ? c.substring(c.lastIndexOf('/') + 1) : '',
                    status: 'verified',
                };
            }
            const certType = c.type ?? 'ielts';
            const customName = c.custom_type_name ?? '';
            
            const isFileName = (str: string) => {
                if (!str) return true;
                return /\.(jpg|jpeg|png|pdf|webp|svg|gif)$/i.test(str) || /^IMG_/i.test(str) || str.includes('/');
            };

            let displayTitle = c.title || '';
            if (!displayTitle || isFileName(displayTitle)) {
                if (certType === 'other' && customName && !isFileName(customName)) {
                    displayTitle = customName;
                } else if (certType === 'ielts') {
                    displayTitle = 'IELTS (Academic / General)';
                } else if (certType === 'cefr') {
                    displayTitle = 'CEFR / Multilevel';
                } else if (certType === 'toefl') {
                    displayTitle = 'TOEFL';
                } else {
                    displayTitle = 'Language Certificate';
                }
            }
            return {
                type: certType,
                custom_type_name: customName,
                title: displayTitle,
                overall: c.overall ?? '',
                listening: c.listening ?? '',
                reading: c.reading ?? '',
                writing: c.writing ?? '',
                speaking: c.speaking ?? '',
                file_url: c.file_url ?? null,
                file_name: c.file_name ?? '',
                status: c.status ?? 'pending',
            };
        });
    }, [rawCerts]);

    // Layout breadcrumbs
    React.useEffect(() => {
        setLayoutProps({
            breadcrumbs: [
                { title: 'find teachers', href: '/pupil/teachers' },
                {
                    title: teacher.full_name,
                    href: `/pupil/teachers/${teacher.id}`,
                },
            ],
        });
    }, [teacher.full_name, teacher.id]);

    // Initials for avatar
    const initials = teacher.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    // Next 7 days generator
    const next7Days = React.useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    }, []);

    // Booking & Slots State
    const [selectedDate, setSelectedDate] = React.useState<Date>(next7Days[0]);
    const [slots, setSlots] = React.useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = React.useState(false);
    const [pickedSlot, setPickedSlot] = React.useState<any | null>(null);
    const [confirmingSlot, setConfirmingSlot] = React.useState<any | null>(null);
    const [booking, setBooking] = React.useState(false);

    // Custom time slot inputs
    const [selectedStartStr, setSelectedStartStr] = React.useState('');
    const [selectedEndStr, setSelectedEndStr] = React.useState('');
    const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
    const [otherChecked, setOtherChecked] = React.useState(false);
    const [customTopic, setCustomTopic] = React.useState('');

    // Video play state
    const [isPlayingVideo, setIsPlayingVideo] = React.useState(false);

    // Helpers
    const formatDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const formatTimeToHHMM = (date: Date) => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    // Load slots for selectedDate
    const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
            const dateStr = formatDateString(selectedDate);
            const response = await axios.get(
                `/bookings/slots/${teacher.id}?date=${dateStr}`,
            );
            setSlots(response.data.slots || []);
            setPickedSlot(null);
        } catch (error) {
            toast.error('Failed to load slots');
        } finally {
            setLoadingSlots(false);
        }
    };

    React.useEffect(() => {
        fetchSlots();

        // Realtime echo setup
        const channel = window.Echo.channel(`teacher.${teacher.id}`);
        channel.listen('.booking.updated', () => {
            fetchSlots();
        });

        return () => {
            window.Echo.leaveChannel(`teacher.${teacher.id}`);
        };
    }, [selectedDate, teacher.id]);

    // Handle Custom range time calculations
    React.useEffect(() => {
        if (confirmingSlot) {
            const start = new Date(confirmingSlot.start_at);
            const end = new Date(confirmingSlot.end_at);
            setSelectedStartStr(formatTimeToHHMM(start));

            // Default to start + 30 minutes
            const defaultEnd = new Date(start.getTime() + 30 * 60 * 1000);
            if (defaultEnd.getTime() > end.getTime()) {
                setSelectedEndStr(formatTimeToHHMM(end));
            } else {
                setSelectedEndStr(formatTimeToHHMM(defaultEnd));
            }

            setSelectedTopics([]);
            setOtherChecked(false);
            setCustomTopic('');
        }
    }, [confirmingSlot]);

    const getSelectedStartAndEnd = () => {
        if (!confirmingSlot) return null;

        const baseDate = new Date(confirmingSlot.start_at);
        const [sh, sm] = selectedStartStr.split(':').map(Number);
        const startLocalDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            sh,
            sm,
        );

        const [eh, em] = selectedEndStr.split(':').map(Number);
        const endLocalDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            eh,
            em,
        );

        return { start: startLocalDate, end: endLocalDate };
    };

    const validateSelectedRange = () => {
        if (!confirmingSlot) return true;
        if (!confirmingSlot.is_all_time) return true;

        const dates = getSelectedStartAndEnd();
        if (!dates) return false;

        const limitStart = new Date(confirmingSlot.start_at);
        const limitEnd = new Date(confirmingSlot.end_at);

        return (
            dates.start.getTime() >= limitStart.getTime() &&
            dates.start.getTime() < limitEnd.getTime() &&
            dates.end.getTime() > dates.start.getTime() &&
            dates.end.getTime() <= limitEnd.getTime()
        );
    };

    const getFinalTopics = () => {
        const topics = [...selectedTopics];
        if (otherChecked && customTopic.trim()) {
            topics.push(customTopic.trim());
        }
        return topics;
    };

    const handleConfirmSubmit = async () => {
        if (!confirmingSlot) return;

        const finalTopics = getFinalTopics();
        if (finalTopics.length === 0) {
            toast.error(t('booking.topics_required') || 'Please select at least one topic');
            return;
        }

        let startAt = confirmingSlot.start_at;
        let endAt = confirmingSlot.end_at;

        if (confirmingSlot.is_all_time) {
            const dates = getSelectedStartAndEnd();
            if (!dates || !validateSelectedRange()) {
                toast.error(t('booking.invalid_range') || 'Selected range is invalid');
                return;
            }
            startAt = dates.start.toISOString();
            endAt = dates.end.toISOString();
        }

        setBooking(true);
        try {
            await axios.post('/bookings', {
                teacher_id: teacher.id,
                pupil_id: auth.user.id,
                start_at: startAt,
                end_at: endAt,
                topics: finalTopics,
                is_trial: lessonType === 'trial',
                duration_minutes: lessonType === 'trial' ? 20 : selectedDuration,
            });
            toast.success(t('booking.success') || 'Appointment booked successfully!');
            setConfirmingSlot(null);
            fetchSlots();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('booking.failed') || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    const hourlyPrice = Number(teacher.teacher_profile?.price ?? 0);
    const formattedHourlyPrice = hourlyPrice > 0 ? `${hourlyPrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : "0 so'm";

    const calculatedTrialPrice = (trialPrice && trialPrice > 0) ? trialPrice : (hourlyPrice > 0 ? Math.round((hourlyPrice / 3) / 1000) * 1000 : 0);
    const formattedTrialPrice = calculatedTrialPrice > 0 ? `${calculatedTrialPrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : "0 so'm";

    const calculatedFullPrice = hourlyPrice > 0 ? Math.round((hourlyPrice * selectedDuration) / 60) : 0;
    const formattedFullPrice = calculatedFullPrice > 0 ? `${calculatedFullPrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : "0 so'm";

    const activePrice = lessonType === 'trial' ? calculatedTrialPrice : calculatedFullPrice;
    const formattedActivePrice = activePrice > 0 ? `${activePrice.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm` : "0 so'm";
    const genderPronoun = teacher.gender === 'male' ? 'his' : teacher.gender === 'female' ? 'her' : 'their';

    return (
        <>
            <Head title={`${teacher.full_name} — Teacher · ConvoMate`} />

            {/* Mockup custom styles */}

            <div className="teacher-profile-pupil-container min-h-screen px-4 py-8 md:px-8">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .teacher-profile-pupil-container {
                        --butter: #F7DE8B;
                        --butter-deep: #F0CE5F;
                        --blue: #A9C6E8;
                        --blue-tint: #EEF4FB;
                        --navy: #1E2A5A;
                        --ink: #22284A;
                        --muted: #6B7394;
                        --line: #E6E9F2;
                        --radius: 22px;
                    }
                    .teacher-profile-pupil-container h1,
                    .teacher-profile-pupil-container h2,
                    .teacher-profile-pupil-container h3,
                    .teacher-profile-pupil-container .bricolage-font {
                        font-family: 'Bricolage Grotesque', sans-serif !important;
                    }
                    .teacher-profile-pupil-container p,
                    .teacher-profile-pupil-container label,
                    .teacher-profile-pupil-container input,
                    .teacher-profile-pupil-container textarea,
                    .teacher-profile-pupil-container select,
                    .teacher-profile-pupil-container span,
                    .teacher-profile-pupil-container button,
                    .teacher-profile-pupil-container div,
                    .teacher-profile-pupil-container aside {
                        font-family: 'Schibsted Grotesk', sans-serif !important;
                    }

                    .teacher-profile-pupil-container {
                        color: var(--ink);
                        background: #FAFBFD;
                        line-height: 1.55;
                        width: 100%;
                    }
                    .teacher-profile-pupil-container .crumb{font-size:13px;color:var(--muted);margin-bottom:16px}
                    .teacher-profile-pupil-container .crumb a{color:var(--muted);text-decoration:none}
                    .teacher-profile-pupil-container .crumb a:hover{color:var(--navy)}

                    .teacher-profile-pupil-container .head-card{
                        background:#fff;border:1px solid var(--line);border-radius:var(--radius);
                        padding:28px;display:flex;gap:24px;align-items:center;position:relative;overflow:hidden;margin-bottom:24px;
                    }
                    .teacher-profile-pupil-container .naqsh{position:absolute;top:14px;right:14px;width:66px;height:66px;opacity:.4;pointer-events:none}
                    .teacher-profile-pupil-container .avatar{
                        width:110px;height:110px;border-radius:26px;flex-shrink:0;
                        background:linear-gradient(135deg,var(--navy),#2E3D7A);
                        display:flex;align-items:center;justify-content:center;
                        font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:38px;color:#fff;
                    }
                    .teacher-profile-pupil-container .avatar-img {
                        width: 110px;
                        height: 110px;
                        border-radius: 26px;
                        flex-shrink: 0;
                        object-fit: cover;
                    }
                    .teacher-profile-pupil-container .head-main{flex:1;min-width:0}
                    .teacher-profile-pupil-container .name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
                    .teacher-profile-pupil-container .name{font-size:30px;font-weight:800;letter-spacing:-0.7px;color:var(--navy);line-height:1.1}
                    .teacher-profile-pupil-container .verified{
                        display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;
                        font-size:11.5px;font-weight:700;padding:5px 12px;border-radius:999px;
                    }
                    .teacher-profile-pupil-container .verified svg{width:11px;height:11px}
                    .teacher-profile-pupil-container .headline{font-size:15.5px;color:var(--ink);margin-top:6px;max-width:56ch}
                    .teacher-profile-pupil-container .head-meta{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}
                    .teacher-profile-pupil-container .score-chip{
                        display:flex;align-items:baseline;gap:7px;border-radius:14px;padding:8px 14px;
                        border:1px solid var(--line);background:#fff;
                    }
                    .teacher-profile-pupil-container .score-chip.hero{background:var(--butter);border-color:var(--butter)}
                    .teacher-profile-pupil-container .score-chip .sv{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:18px;color:var(--navy)}
                    .teacher-profile-pupil-container .score-chip .sl{font-size:12px;font-weight:600;color:var(--muted)}
                    .teacher-profile-pupil-container .score-chip.hero .sl{color:#7A6520}
                    .teacher-profile-pupil-container .new-badge{
                        display:inline-flex;align-items:center;gap:7px;
                        background:var(--blue-tint);border:1px solid #D8E5F5;border-radius:999px;
                        padding:8px 14px;font-size:12.5px;font-weight:600;color:var(--navy);
                    }
                    .teacher-profile-pupil-container .new-badge .spark{color:var(--butter-deep)}
                    @media(max-width:700px){
                        .teacher-profile-pupil-container .head-card{flex-direction:column;align-items:flex-start}
                        .teacher-profile-pupil-container .avatar{width:84px;height:84px;font-size:28px;border-radius:20px}
                        .teacher-profile-pupil-container .avatar-img{width:84px;height:84px;border-radius:20px}
                    }

                    .teacher-profile-pupil-container .body-grid{display:grid;grid-template-columns:1fr 330px;gap:24px;align-items:start}
                    @media(max-width:880px){.teacher-profile-pupil-container .body-grid{grid-template-columns:1fr}}

                    .teacher-profile-pupil-container .main-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden}
                    .teacher-profile-pupil-container .section{padding:26px 28px;border-bottom:1px solid var(--line)}
                    .teacher-profile-pupil-container .section:last-child{border-bottom:none}
                    .teacher-profile-pupil-container .sec-title{
                        display:flex;align-items:center;gap:10px;
                        font-family:'Bricolage Grotesque',sans-serif;font-size:17px;font-weight:700;
                        color:var(--navy);letter-spacing:-0.2px;margin-bottom:16px;
                    }
                    .teacher-profile-pupil-container .sec-title .n{
                        width:26px;height:26px;border-radius:9px;background:var(--blue-tint);
                        display:flex;align-items:center;justify-content:center;flex-shrink:0;
                    }
                    .teacher-profile-pupil-container .sec-title .n svg{width:14px;height:14px;stroke:var(--navy)}

                    .teacher-profile-pupil-container .intro{
                        border-radius:16px;overflow:hidden;position:relative;background:var(--navy);
                        aspect-ratio:16/7.5;display:flex;align-items:center;justify-content:center;cursor:pointer;
                        width:100%;
                    }
                    .teacher-profile-pupil-container .intro .glow{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 20%, rgba(169,198,232,.28), transparent 55%),radial-gradient(ellipse at 80% 90%, rgba(247,222,139,.18), transparent 50%)}
                    .teacher-profile-pupil-container .play{width:56px;height:56px;border-radius:50%;background:var(--butter);display:flex;align-items:center;justify-content:center;z-index:2;transition:transform .2s;box-shadow:0 8px 24px rgba(0,0,0,.25)}
                    .teacher-profile-pupil-container .intro:hover .play{transform:scale(1.07)}
                    .teacher-profile-pupil-container .play svg{width:18px;height:18px;fill:var(--navy);margin-left:2px}
                    .teacher-profile-pupil-container .intro .tag{position:absolute;left:16px;bottom:13px;z-index:2;color:#fff;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:7px}
                    .teacher-profile-pupil-container .intro .tag .rec{width:7px;height:7px;border-radius:50%;background:var(--butter)}
                    .teacher-profile-pupil-container .intro .dur{position:absolute;right:16px;bottom:13px;z-index:2;color:rgba(255,255,255,.75);font-size:12px}

                    .teacher-profile-pupil-container .bio{font-size:14.5px;color:var(--ink);max-width:62ch;white-space:pre-wrap}
                    .teacher-profile-pupil-container .bio+.bio{margin-top:9px}
                    .teacher-profile-pupil-container .chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
                    .teacher-profile-pupil-container .chip{background:var(--blue-tint);color:var(--navy);border:1px solid #D8E5F5;font-size:13px;font-weight:600;padding:7px 14px;border-radius:999px}

                    .teacher-profile-pupil-container .cert{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px dashed var(--line)}
                    .teacher-profile-pupil-container .cert:first-of-type{padding-top:0}
                    .teacher-profile-pupil-container .cert:last-of-type{border-bottom:none;padding-bottom:0}
                    .teacher-profile-pupil-container .cert-ic{width:38px;height:38px;border-radius:12px;background:var(--blue-tint);display:flex;align-items:center;justify-content:center;flex-shrink:0}
                    .teacher-profile-pupil-container .cert-ic svg{width:16px;height:16px;stroke:var(--navy)}
                    .teacher-profile-pupil-container .cert-body{flex:1;min-width:0}
                    .teacher-profile-pupil-container .cert-name{font-weight:700;font-size:14px}
                    .teacher-profile-pupil-container .cert-sub{font-size:12px;color:var(--muted)}
                    .teacher-profile-pupil-container .cert-badge{font-size:11px;font-weight:700;color:var(--navy);background:var(--butter);padding:4px 11px;border-radius:999px;white-space:nowrap}
                    .teacher-profile-pupil-container .cert-badge.review{background:var(--line);color:var(--muted)}

                    .teacher-profile-pupil-container .fb-empty{
                        border:1.5px dashed var(--blue);border-radius:16px;background:var(--blue-tint);
                        padding:24px;text-align:center;
                    }
                    .teacher-profile-pupil-container .fb-empty .big{font-family:'Bricolage Grotesque',sans-serif;font-size:16.5px;font-weight:700;color:var(--navy)}
                    .teacher-profile-pupil-container .fb-empty p{font-size:13.5px;color:var(--muted);margin-top:5px;max-width:42ch;margin-left:auto;margin-right:auto}

                    .teacher-profile-pupil-container .book{
                        position:sticky;top:24px;
                        background:#fff;border:1px solid var(--line);border-radius:var(--radius);
                        padding:24px;box-shadow:0 12px 40px rgba(30,42,90,.07);overflow:hidden;
                    }
                    .teacher-profile-pupil-container .book .corner{position:absolute;top:-1px;right:-1px;width:58px;height:58px;opacity:.5;pointer-events:none}
                    .teacher-profile-pupil-container .price-row{display:flex;align-items:baseline;gap:8px}
                    .teacher-profile-pupil-container .price{font-family:'Bricolage Grotesque',sans-serif;font-size:29px;font-weight:800;color:var(--navy);letter-spacing:-0.5px}
                    .teacher-profile-pupil-container .per{font-size:13px;color:var(--muted);font-weight:500}
                    .teacher-profile-pupil-container .ltype{
                        border:1.5px solid var(--line);border-radius:16px;padding:14px 16px;cursor:pointer;margin-bottom:12px;position:relative;background:#fff;transition:all .15s;
                    }
                    .teacher-profile-pupil-container .ltype.trial{background:#FFF9E5;border-color:var(--butter-deep)}
                    .teacher-profile-pupil-container .ltype.sel{border-color:var(--navy);box-shadow:0 0 0 1px var(--navy)}
                    .teacher-profile-pupil-container .durs{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
                    .teacher-profile-pupil-container .dur{border:1.5px solid var(--line);border-radius:999px;padding:6px 13px;font-size:12.5px;font-weight:600;color:var(--ink);cursor:pointer;background:#fff;transition:all .15s}
                    .teacher-profile-pupil-container .dur.sel{background:var(--navy);border-color:var(--navy);color:#fff}
                    .teacher-profile-pupil-container .rail-label{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:20px 0 9px}
                    .teacher-profile-pupil-container .day-tabs{display:flex;gap:6px}
                    .teacher-profile-pupil-container .day-tab{
                        flex:1;text-align:center;border:1px solid var(--line);border-radius:12px;padding:8px 4px;
                        cursor:pointer;background:#fff;transition:all .15s;
                    }
                    .teacher-profile-pupil-container .day-tab .dn{font-size:10.5px;color:var(--muted);font-weight:700;letter-spacing:.03em;text-transform:uppercase}
                    .teacher-profile-pupil-container .day-tab .dd{font-family:'Bricolage Grotesque',sans-serif;font-size:15px;font-weight:700;color:var(--ink)}
                    .teacher-profile-pupil-container .day-tab.active{background:var(--navy);border-color:var(--navy)}
                    .teacher-profile-pupil-container .day-tab.active .dn{color:var(--blue)}
                    .teacher-profile-pupil-container .day-tab.active .dd{color:#fff}
                    .teacher-profile-pupil-container .slots{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
                    .teacher-profile-pupil-container .slot{
                        border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:13px;
                        font-weight:600;color:var(--ink);cursor:pointer;background:#fff;transition:all .15s;font-family:inherit;
                    }
                    .teacher-profile-pupil-container .slot:hover{border-color:var(--navy)}
                    .teacher-profile-pupil-container .slot.picked{background:var(--butter);border-color:var(--butter);color:var(--navy)}
                    .teacher-profile-pupil-container .cta{
                        display:block;width:100%;margin-top:20px;border:none;cursor:pointer;
                        background:var(--butter);color:var(--navy);
                        font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:15.5px;
                        padding:15px;border-radius:999px;transition:all .15s;letter-spacing:-0.2px;
                    }
                    .teacher-profile-pupil-container .cta:hover{background:var(--butter-deep);transform:translateY(-1px)}
                    .teacher-profile-pupil-container .cta:disabled{opacity:0.6;cursor:not-allowed}
                    .teacher-profile-pupil-container .book-meta{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}
                    .teacher-profile-pupil-container .bm-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
                    .teacher-profile-pupil-container .bm-row .k{color:var(--muted)}
                    .teacher-profile-pupil-container .bm-row .v{font-weight:600;color:var(--ink)}
                    .teacher-profile-pupil-container .assure{margin-top:14px;font-size:12px;color:var(--muted);text-align:center;line-height:1.5}
                    .teacher-profile-pupil-container .assure b{color:var(--navy)}
                    .teacher-profile-pupil-container .tz{font-size:11.5px;color:var(--muted);margin-top:10px}
                ` }} />

                {/* Breadcrumbs */}
                <div className="crumb">
                    <Link href="/pupil/teachers">Find Teachers</Link> / {teacher.full_name}
                </div>

                {/* 1. Header Card */}
                <div className="head-card shadow-sm">
                    <svg className="naqsh" viewBox="0 0 80 80" fill="none" stroke="#A9C6E8" stroke-width="1.1">
                        <path d="M40 6 L52 28 L74 40 L52 52 L40 74 L28 52 L6 40 L28 28 Z" />
                        <path d="M40 20 L47 33 L60 40 L47 47 L40 60 L33 47 L20 40 L33 33 Z" />
                        <circle cx="40" cy="40" r="5" />
                    </svg>

                    {teacher.avatar ? (
                        <img src={teacher.avatar} alt={teacher.full_name} className="avatar-img shadow" />
                    ) : (
                        <div className="avatar shadow-lg">
                            {initials}
                        </div>
                    )}

                    <div className="head-main">
                        <div className="name-row">
                            <h1 className="name">{teacher.full_name}</h1>
                            {teacher.teacher_profile?.is_verified && (
                                <span className="verified">
                                    <Check className="h-3 w-3 stroke-[3]" /> Verified by ConvoMate
                                </span>
                            )}
                        </div>
                        <p className="headline">
                            {teacher.teacher_profile?.headline || 'Professional English Speaking Tutor'}
                        </p>
                        <div className="head-meta">
                            {normalizedCerts.length > 0 && (normalizedCerts[0]?.speaking || teacher.teacher_profile?.speaking_band) && (
                                <div className="score-chip hero">
                                    <span className="sv">{normalizedCerts[0]?.speaking || teacher.teacher_profile?.speaking_band}</span>
                                    <span className="sl">Speaking band</span>
                                </div>
                            )}
                            {normalizedCerts.length > 0 && (normalizedCerts[0]?.overall || teacher.teacher_profile?.overall_level) && (
                                <div className="score-chip">
                                    <span className="sv">
                                        {normalizedCerts[0]?.overall || (teacher.teacher_profile?.overall_level ? teacher.teacher_profile.overall_level.replace(/IELTS\s*,?\s*/i, '').trim() : '')}
                                    </span>
                                    <span className="sl">
                                        Overall {normalizedCerts[0]?.type === 'other' && normalizedCerts[0]?.custom_type_name ? normalizedCerts[0].custom_type_name : (normalizedCerts[0]?.type ? String(normalizedCerts[0].type).toUpperCase() : 'IELTS')}
                                    </span>
                                </div>
                            )}
                            <span className="new-badge">
                                <Sparkles className="spark h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                {t(`teacher.taking_first_students_${teacher.gender === 'male' ? 'his' : teacher.gender === 'female' ? 'her' : 'their'}`) || (
                                    teacher.gender === 'male'
                                        ? 'New on ConvoMate — taking his first students'
                                        : teacher.gender === 'female'
                                            ? 'New on ConvoMate — taking her first students'
                                            : 'New on ConvoMate — taking their first students'
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Grid Body */}
                <div className="body-grid">

                    {/* Main Content card */}
                    <div className="main-card shadow-sm">

                        {/* Section 1: Intro Video */}
                        {teacher.teacher_profile?.intro_video_url && (
                            <div className="section">
                                <div className="sec-title">
                                    <span className="n"><Video className="h-3.5 w-3.5" /></span>
                                    Hear her speak first
                                </div>
                                {isPlayingVideo ? (
                                    <div className="rounded-2xl overflow-hidden border bg-black aspect-video w-full">
                                        <video
                                            src={teacher.teacher_profile.intro_video_url}
                                            controls
                                            autoPlay
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="intro"
                                        tabIndex={0}
                                        role="button"
                                        aria-label="Play intro video"
                                        onClick={() => setIsPlayingVideo(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setIsPlayingVideo(true);
                                            }
                                        }}
                                    >
                                        <div className="glow"></div>
                                        <div className="play">
                                            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5 fill-navy">
                                                <path d="M4 2 L18 10 L4 18 Z" />
                                            </svg>
                                        </div>
                                        <div className="tag">
                                            <span className="rec"></span> Unscripted — a real hello
                                        </div>
                                        <div className="dur">100MB max</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section 2: About Bio & Focus */}
                        <div className="section">
                            <div className="sec-title">
                                <span className="n"><User className="h-3.5 w-3.5" /></span>
                                About {teacher.full_name.split(' ')[0]}
                            </div>
                            <div className="bio">
                                {teacher.teacher_profile?.bio || 'No bio description provided yet.'}
                            </div>
                            {teacher.teacher_profile?.labels && teacher.teacher_profile.labels.length > 0 && (
                                <div className="chips">
                                    {teacher.teacher_profile.labels.map((lbl) => (
                                        <span key={lbl} className="chip">
                                            {t(`labels.${lbl}`) || lbl}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section 3: Certificates */}
                        <div className="section">
                            <div className="sec-title">
                                <span className="n"><Award className="h-3.5 w-3.5" /></span>
                                Certificates
                            </div>
                            {normalizedCerts.length > 0 ? (
                                <div className="space-y-4">
                                    {normalizedCerts.map((cert, idx) => (
                                        <div key={idx} className="rounded-2xl border border-[#E6E9F2] bg-white p-4 space-y-3 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1E2A5A]">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[#1E2A5A]">
                                                            {cert.title || (cert.type === 'other' ? cert.custom_type_name : cert.type?.toUpperCase()) || 'Language Certificate'}
                                                        </h4>
                                                    </div>
                                                </div>
                                                {cert.status === 'verified' ? (
                                                    <span className="inline-flex items-center rounded-full bg-[#F7DE8B] px-3 py-1 text-xs font-bold text-[#1E2A5A]">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-bold text-[#6B7394]">
                                                        Under review
                                                    </span>
                                                )}
                                            </div>

                                            {/* Sub-scores layout */}
                                            <div className="rounded-xl bg-[#FAFBFD] border border-[#E6E9F2]/60 p-3">
                                                {/* Mobile layout (< sm): vertical stacked key-value list */}
                                                <div className="flex flex-col gap-2 sm:hidden text-xs">
                                                    <div className="flex items-center justify-between border-b border-[#E6E9F2]/50 pb-1.5">
                                                        <span className="font-bold text-[#6B7394]">Overall:</span>
                                                        <span className="font-extrabold text-[#1E2A5A]">{cert.overall || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-b border-[#E6E9F2]/50 pb-1.5">
                                                        <span className="font-bold text-[#6B7394]">Listening:</span>
                                                        <span className="font-extrabold text-[#1E2A5A]">{cert.listening || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-b border-[#E6E9F2]/50 pb-1.5">
                                                        <span className="font-bold text-[#6B7394]">Reading:</span>
                                                        <span className="font-extrabold text-[#1E2A5A]">{cert.reading || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-b border-[#E6E9F2]/50 pb-1.5">
                                                        <span className="font-bold text-[#6B7394]">Writing:</span>
                                                        <span className="font-extrabold text-[#1E2A5A]">{cert.writing || '—'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-[#6B7394]">Speaking:</span>
                                                        <span className="font-extrabold text-[#1E2A5A]">{cert.speaking || '—'}</span>
                                                    </div>
                                                </div>

                                                {/* Desktop layout (>= sm): 5 horizontal columns */}
                                                <div className="hidden sm:grid sm:grid-cols-5 gap-1.5 text-center">
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase text-[#6B7394]">Overall</span>
                                                        <span className="text-xs font-extrabold text-[#1E2A5A]">{cert.overall || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase text-[#6B7394]">Listening</span>
                                                        <span className="text-xs font-extrabold text-[#1E2A5A]">{cert.listening || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase text-[#6B7394]">Reading</span>
                                                        <span className="text-xs font-extrabold text-[#1E2A5A]">{cert.reading || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase text-[#6B7394]">Writing</span>
                                                        <span className="text-xs font-extrabold text-[#1E2A5A]">{cert.writing || '—'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase text-[#6B7394]">Speaking</span>
                                                        <span className="text-xs font-extrabold text-[#1E2A5A]">{cert.speaking || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-muted-foreground italic">
                                    No certificates uploaded yet.
                                </p>
                            )}
                        </div>

                        {/* Section 4: Pupil feedback */}
                        <div className="section">
                            <div className="sec-title">
                                <span className="n"><MessageCircle className="h-3.5 w-3.5" /></span>
                                Pupil feedback
                            </div>
                            {teacher.feedbacks && teacher.feedbacks.length > 0 ? (
                                <div className="space-y-4">
                                    {teacher.feedbacks.map((fb) => (
                                        <div key={fb.id} className="rounded-2xl border border-muted/50 bg-[#FAFBFD] p-5 shadow-sm">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4FB] text-xs font-bold text-[#1E2A5A] overflow-hidden">
                                                        {fb.author?.avatar ? (
                                                            <img src={fb.author.avatar} className="h-full w-full object-cover" alt="avatar" />
                                                        ) : (
                                                            fb.author?.full_name?.substring(0, 2).toUpperCase() || 'P'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[#1E2A5A]">
                                                            {fb.author?.full_name || 'Pupil'}
                                                        </h4>
                                                        <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                                                            {new Date(fb.created_at).toLocaleDateString([], {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 rounded-lg border border-amber-500/10 bg-amber-500/5 px-2.5 py-1 text-xs font-bold text-amber-600">
                                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {fb.rating}/10
                                                </div>
                                            </div>
                                            <p className="text-sm leading-relaxed text-[#6B7394] italic">
                                                "{fb.comment}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="fb-empty">
                                    <div className="big">
                                        {t(`teacher.no_reviews_be_${teacher.gender === 'male' ? 'his' : teacher.gender === 'female' ? 'her' : 'their'}`) || (
                                            teacher.gender === 'male'
                                                ? 'No reviews yet — be his first'
                                                : teacher.gender === 'female'
                                                    ? 'No reviews yet — be her first'
                                                    : 'No reviews yet — be their first'
                                        )}
                                    </div>
                                    <p>{teacher.full_name} is new here. Book a first session at half price and help other students decide.</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Booking sidebar rail */}
                    <aside>
                        <div className="book shadow-sm">
                            <svg className="corner" viewBox="0 0 64 64" fill="none" stroke="#F0CE5F" strokeWidth="1.2">
                                <path d="M64 0 v40 M64 0 h-40" />
                                <path d="M52 0 v12 h12 M40 0 v24 h24" />
                                <circle cx="52" cy="12" r="3" />
                            </svg>
                            <div className="price-row">
                                <span className="price">{formattedHourlyPrice}</span>
                                <span className="per">/ hour</span>
                            </div>

                            <div className="rail-label">Lesson type</div>

                            {hasEligibleTrial && (
                                <div
                                    className={`ltype trial ${lessonType === 'trial' ? 'sel' : ''}`}
                                    onClick={() => setLessonType('trial')}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <span className="font-bold text-[15px] text-[#22284A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                                Trial lesson
                                            </span>
                                            <span className="text-[9.5px] font-extrabold tracking-wider uppercase bg-[#1E2A5A] text-[#F7DE8B] rounded-full px-2.5 py-0.5 whitespace-nowrap">
                                                First time only
                                            </span>
                                        </div>
                                        <span className="font-bold text-[15px] text-[#1E2A5A] whitespace-nowrap" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                            {formattedTrialPrice}
                                        </span>
                                    </div>
                                    <div className="text-[12.5px] text-[#6B7394] mt-1.5 leading-snug">
                                        20 minutes to meet {teacher.full_name?.split(' ')[0] || 'teacher'} — ⅓ of {genderPronoun} lesson price. One per teacher.
                                    </div>
                                </div>
                            )}

                            <div
                                className={`ltype ${lessonType === 'full' ? 'sel' : ''}`}
                                onClick={() => setLessonType('full')}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-[15px] text-[#22284A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                        Full lesson
                                    </span>
                                    <span className="font-bold text-[15px] text-[#1E2A5A] whitespace-nowrap" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                        {formattedFullPrice}
                                    </span>
                                </div>
                                <div className="text-[12.5px] text-[#6B7394] mt-1.5 leading-snug">
                                    Regular session at {genderPronoun} standard rate. Pick your length below.
                                </div>
                            </div>

                            {lessonType === 'full' && (
                                <div className="mt-3 mb-2">
                                    <div className="rail-label" style={{ marginTop: '12px' }}>Duration</div>
                                    <div className="durs">
                                        {[
                                            { mins: 30, label: '30 min' },
                                            { mins: 45, label: '45 min' },
                                            { mins: 60, label: '1 h' },
                                            { mins: 90, label: '1.5 h' },
                                            { mins: 120, label: '2 h' },
                                        ].map((dItem) => (
                                            <span
                                                key={dItem.mins}
                                                className={`dur ${selectedDuration === dItem.mins ? 'sel' : ''}`}
                                                onClick={() => setSelectedDuration(dItem.mins)}
                                            >
                                                {dItem.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pick a day */}
                            <div className="rail-label">Pick a day</div>
                            <div className="day-tabs">
                                {next7Days.map((day, idx) => {
                                    const isActive = formatDateString(day) === formatDateString(selectedDate);
                                    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                                    const dateNum = day.getDate();
                                    return (
                                        <div
                                            key={idx}
                                            className={`day-tab ${isActive ? 'active' : ''}`}
                                            tabIndex={0}
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setPickedSlot(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setSelectedDate(day);
                                                    setPickedSlot(null);
                                                }
                                            }}
                                        >
                                            <div className="dn">{dayName}</div>
                                            <div className="dd">{dateNum}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pick a time */}
                            <div className="rail-label">Pick a time</div>
                            {loadingSlots ? (
                                <div className="flex py-6 justify-center items-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1E2A5A]" />
                                </div>
                            ) : slots.length > 0 ? (
                                <div className="slots">
                                    {slots.map((slot, idx) => {
                                        const isPicked = pickedSlot === slot;
                                        const formattedTime = new Date(slot.start_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        });
                                        return (
                                            <button
                                                key={idx}
                                                className={`slot ${isPicked ? 'picked' : ''}`}
                                                onClick={() => setPickedSlot(slot)}
                                            >
                                                {slot.is_all_time ? 'Custom Slot' : formattedTime}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic py-2">
                                    No available slots for this day.
                                </p>
                            )}

                            <p className="tz">Times in your timezone — Tashkent (UTC+5)</p>

                            {pickedSlot && (
                                <div className="mt-3.5 bg-[#F7F6F2] border border-[#E8E6DE] rounded-xl p-3 text-[13px] text-[#6B7394] leading-relaxed">
                                    <b className="text-[#22284A]">
                                        {lessonType === 'trial' ? 'Trial · 20 min' : `Full lesson · ${selectedDuration >= 60 ? selectedDuration / 60 + ' h' : selectedDuration + ' min'}`}
                                    </b> with {teacher.full_name?.split(' ')[0] || 'teacher'}<br />
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}, {new Date(pickedSlot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} – {(() => {
                                        const p = new Date(pickedSlot.start_at);
                                        const durMins = lessonType === 'trial' ? 20 : selectedDuration;
                                        const endD = new Date(p.getTime() + durMins * 60000);
                                        return endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                    })()} · <b className="text-[#1E2A5A]">{formattedActivePrice}</b>
                                </div>
                            )}

                            <button
                                className="cta"
                                disabled={auth?.user?.role === 'teacher' || !pickedSlot || booking}
                                onClick={() => setConfirmingSlot(pickedSlot)}
                            >
                                {auth?.user?.role === 'teacher'
                                    ? 'Viewing Teacher Profile'
                                    : pickedSlot
                                    ? `Pay ${formattedActivePrice} & book`
                                    : 'Select a slot first'}
                            </button>

                            <div className="book-meta">
                                <div className="bm-row">
                                    <span className="k">Where</span>
                                    <span className="v">Video call on ConvoMate</span>
                                </div>
                                <div className="bm-row">
                                    <span className="k">Cancellation</span>
                                    <span className="v">Free up to 12 hrs before</span>
                                </div>
                            </div>
                            <p className="assure">
                                A <b>real conversation</b> with a real teacher.<br />
                                No bots. No scripts. That's the point.
                            </p>
                        </div>
                    </aside>

                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmingSlot && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#22284A]/40 backdrop-blur-sm">
                    <div className="relative mx-4 flex w-full max-w-md animate-in flex-col rounded-3xl border border-[#E6E9F2] bg-white p-6 shadow-2xl duration-150 zoom-in-95" style={{ fontFamily: "'Schibsted Grotesk', sans-serif" }}>
                        <button
                            onClick={() => setConfirmingSlot(null)}
                            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#6B7394] hover:bg-[#A9C6E8] hover:text-[#1E2A5A] transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mt-2 flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1E2A5A]">
                                <Info className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-[#1E2A5A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                                    {confirmingSlot.is_all_time
                                        ? t('booking.all_time_title') || 'Select Custom Slot Time'
                                        : t('booking.confirm_title') || 'Confirm Booking'}
                                </h3>

                                {confirmingSlot.is_all_time ? (
                                    <div className="mt-3 space-y-4">
                                        <p className="text-sm leading-relaxed text-[#6B7394]">
                                            {t('booking.all_time_desc') || 'Choose a specific start and end time for your custom session.'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-1">
                                                <label className="text-xs font-semibold text-[#22284A]">
                                                    {t('booking.all_time_start') || 'Start Time'}
                                                </label>
                                                <input
                                                    type="time"
                                                    value={selectedStartStr}
                                                    onChange={(e) => setSelectedStartStr(e.target.value)}
                                                    min={formatTimeToHHMM(new Date(confirmingSlot.start_at))}
                                                    max={formatTimeToHHMM(new Date(confirmingSlot.end_at))}
                                                    className="mt-1 rounded-xl border border-[#E6E9F2] p-2 text-sm text-[#22284A] focus:outline-none focus:border-[#1E2A5A]"
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <label className="text-xs font-semibold text-[#22284A]">
                                                    {t('booking.all_time_end') || 'End Time'}
                                                </label>
                                                <input
                                                    type="time"
                                                    value={selectedEndStr}
                                                    onChange={(e) => setSelectedEndStr(e.target.value)}
                                                    min={selectedStartStr || formatTimeToHHMM(new Date(confirmingSlot.start_at))}
                                                    max={formatTimeToHHMM(new Date(confirmingSlot.end_at))}
                                                    className="mt-1 rounded-xl border border-[#E6E9F2] p-2 text-sm text-[#22284A] focus:outline-none focus:border-[#1E2A5A]"
                                                />
                                            </div>
                                        </div>

                                        {!validateSelectedRange() && (
                                            <p className="text-xs text-red-500 font-bold">
                                                {t('booking.invalid_range') || 'Selected range is invalid.'}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm leading-relaxed text-[#6B7394]">
                                        {t('booking.confirm_message', {
                                            teacher: teacher.full_name,
                                            start: new Date(confirmingSlot.start_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }),
                                            end: new Date(confirmingSlot.end_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }),
                                        }) || `Book a session with ${teacher.full_name} from ${new Date(confirmingSlot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(confirmingSlot.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?`}
                                    </p>
                                )}

                                {/* Topic selection */}
                                <div className="space-y-2 mt-4 border-t border-[#E6E9F2] pt-3">
                                    <label className="text-xs font-semibold text-[#22284A]">
                                        {t('booking.select_topics') || 'Select Speaking Topics'} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {teacher.teacher_profile?.labels?.map((lbl: string) => {
                                            const isChecked = selectedTopics.includes(lbl);
                                            return (
                                                <button
                                                    key={lbl}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isChecked) {
                                                            setSelectedTopics(selectedTopics.filter((t) => t !== lbl));
                                                        } else {
                                                            setSelectedTopics([...selectedTopics, lbl]);
                                                        }
                                                    }}
                                                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${isChecked
                                                            ? 'bg-[#1E2A5A] border-[#1E2A5A] text-white'
                                                            : 'bg-[#EEF4FB] border-[#D8E5F5] text-[#1E2A5A] hover:bg-[#A9C6E8]'
                                                        }`}
                                                >
                                                    {t(`labels.${lbl}`) || lbl}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setOtherChecked(!otherChecked)}
                                            className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${otherChecked
                                                    ? 'bg-[#1E2A5A] border-[#1E2A5A] text-white'
                                                    : 'bg-[#EEF4FB] border-[#D8E5F5] text-[#1E2A5A] hover:bg-[#A9C6E8]'
                                                }`}
                                        >
                                            {t('booking.topic_other') || 'Other...'}
                                        </button>
                                    </div>

                                    {otherChecked && (
                                        <div className="mt-2.5">
                                            <input
                                                type="text"
                                                placeholder={t('booking.topic_other_placeholder') || 'Enter custom topic...'}
                                                value={customTopic}
                                                onChange={(e) => setCustomTopic(e.target.value)}
                                                className="w-full rounded-xl border border-[#E6E9F2] p-2 text-sm text-[#22284A] focus:outline-none focus:border-[#1E2A5A]"
                                                maxLength={100}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setConfirmingSlot(null)}
                                        className="cursor-pointer rounded-xl border border-[#E6E9F2] px-4 py-2 text-sm font-semibold text-[#6B7394] transition-colors hover:bg-[#FAFBFD]"
                                    >
                                        {t('booking.cancel_btn') || 'Cancel'}
                                    </button>
                                    <button
                                        onClick={handleConfirmSubmit}
                                        disabled={booking || !validateSelectedRange()}
                                        className="cursor-pointer rounded-xl bg-[#F7DE8B] hover:bg-[#F0CE5F] px-5 py-2 text-sm font-bold text-[#1E2A5A] shadow-md shadow-brand-button/10 transition-colors disabled:opacity-50"
                                    >
                                        {booking
                                            ? t('booking.requesting') || 'Requesting...'
                                            : t('booking.confirm_btn') || 'Confirm Booking'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}

TeacherProfile.layout = {
    breadcrumbs: [
        { title: 'find teachers', href: '/pupil/teachers' },
        { title: '...', href: '#' },
    ],
};
