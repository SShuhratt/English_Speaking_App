import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth & {
        user: {
            role: 'teacher' | 'pupil';
            teacher_profile?: {
                age?: number;
                phone_number?: string;
                experience_years?: number;
                workplace?: string;
                overall_level?: string;
                speaking_band?: number;
                certificates?: string[];
            };
            pupil_profile?: {
                age?: number;
                phone_number?: string;
                level?: string;
            };
        };
    };
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name || auth.user.full_name || ''}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {auth.user.role === 'teacher' && (
                                <div className="border-t pt-6 mt-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Teacher Profile Information</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Provide information about your certifications, IELTS scores, and availability.</p>
                                    </div>
                                    
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="age">Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.teacher_profile?.age || ''}
                                                name="age"
                                                placeholder="e.g. 28"
                                            />
                                            <InputError className="mt-2" message={errors.age} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone_number">Phone Number</Label>
                                            <Input
                                                id="phone_number"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.teacher_profile?.phone_number || ''}
                                                name="phone_number"
                                                placeholder="+998 90 123 4567"
                                            />
                                            <InputError className="mt-2" message={errors.phone_number} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="overall_level">Overall IELTS Level / Grade</Label>
                                            <Input
                                                id="overall_level"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.teacher_profile?.overall_level || ''}
                                                name="overall_level"
                                                placeholder="e.g. IELTS 8.5"
                                            />
                                            <InputError className="mt-2" message={errors.overall_level} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="speaking_band">Speaking Band Score</Label>
                                            <Input
                                                id="speaking_band"
                                                type="number"
                                                step="0.5"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.teacher_profile?.speaking_band || ''}
                                                name="speaking_band"
                                                placeholder="e.g. 8.5"
                                            />
                                            <InputError className="mt-2" message={errors.speaking_band} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="experience_years">Years of Experience</Label>
                                            <Input
                                                id="experience_years"
                                                type="number"
                                                step="0.5"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.teacher_profile?.experience_years || ''}
                                                name="experience_years"
                                                placeholder="e.g. 4.5"
                                            />
                                            <InputError className="mt-2" message={errors.experience_years} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="workplace">Current Workplace / Institution</Label>
                                            <Input
                                                id="workplace"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.teacher_profile?.workplace || ''}
                                                name="workplace"
                                                placeholder="e.g. British Council"
                                            />
                                            <InputError className="mt-2" message={errors.workplace} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="certificates">Certificates (Comma-separated)</Label>
                                        <Input
                                            id="certificates"
                                            type="text"
                                            className="mt-1 block w-full"
                                            defaultValue={auth.user.teacher_profile?.certificates?.join(', ') || ''}
                                            name="certificates"
                                            placeholder="CELTA, IELTS Trainer, TESOL"
                                        />
                                        <InputError className="mt-2" message={errors.certificates} />
                                    </div>
                                </div>
                            )}

                            {auth.user.role === 'pupil' && (
                                <div className="border-t pt-6 mt-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Pupil Profile Information</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Fill in your profile details to help teachers adapt lessons to your level.</p>
                                    </div>
                                    
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="age">Age</Label>
                                            <Input
                                                id="age"
                                                type="number"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.pupil_profile?.age || ''}
                                                name="age"
                                                placeholder="e.g. 18"
                                            />
                                            <InputError className="mt-2" message={errors.age} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="phone_number">Phone Number</Label>
                                            <Input
                                                id="phone_number"
                                                type="text"
                                                className="mt-1 block w-full"
                                                defaultValue={auth.user.pupil_profile?.phone_number || ''}
                                                name="phone_number"
                                                placeholder="+998 90 123 4567"
                                            />
                                            <InputError className="mt-2" message={errors.phone_number} />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="level">English Target Level</Label>
                                            <select
                                                id="level"
                                                name="level"
                                                className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                defaultValue={auth.user.pupil_profile?.level || ''}
                                            >
                                                <option value="">Select Level</option>
                                                <option value="beginner">Beginner</option>
                                                <option value="pre-intermediate">Pre-Intermediate</option>
                                                <option value="upper-intermediate">Upper-Intermediate</option>
                                                <option value="advanced">Advanced</option>
                                                <option value="ielts_band">IELTS Band</option>
                                                <option value="cefr_band">CEFR Band</option>
                                            </select>
                                            <InputError className="mt-2" message={errors.level} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
