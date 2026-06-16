import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    const [role, setRole] = useState<'teacher' | 'pupil'>('pupil');

    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Join as a</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setRole('pupil')}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center cursor-pointer transition-all ${
                                            role === 'pupil'
                                                ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-200'
                                                : 'border-muted hover:border-muted-foreground bg-transparent'
                                        }`}
                                    >
                                        <span className="font-semibold text-sm">Pupil</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">Book speaking sessions</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('teacher')}
                                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center cursor-pointer transition-all ${
                                            role === 'teacher'
                                                ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-200'
                                                : 'border-muted hover:border-muted-foreground bg-transparent'
                                        }`}
                                    >
                                        <span className="font-semibold text-sm">Teacher</span>
                                        <span className="text-[10px] text-muted-foreground mt-1">Teach & manage schedule</span>
                                    </button>
                                    <input type="hidden" name="role" value={role} />
                                </div>
                                <InputError message={errors.role} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    required
                                    name="age"
                                    placeholder="Enter your age"
                                />
                                <InputError message={errors.age} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">Phone Number</Label>
                                <Input
                                    id="phone_number"
                                    type="text"
                                    required
                                    name="phone_number"
                                    placeholder="+998 90 123 4567"
                                />
                                <InputError message={errors.phone_number} />
                            </div>

                            {role === 'pupil' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="level">English Target Level</Label>
                                    <select
                                        id="level"
                                        name="level"
                                        required
                                        className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Level</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="pre-intermediate">Pre-Intermediate</option>
                                        <option value="upper-intermediate">Upper-Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                        <option value="ielts_band">IELTS Band</option>
                                        <option value="cefr_band">CEFR Band</option>
                                    </select>
                                    <InputError message={errors.level} />
                                </div>
                            )}

                            {role === 'teacher' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="overall_level">Overall IELTS Level / Grade</Label>
                                        <Input
                                            id="overall_level"
                                            type="text"
                                            required
                                            name="overall_level"
                                            placeholder="e.g. IELTS 8.5"
                                        />
                                        <InputError message={errors.overall_level} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="speaking_band">Speaking Band Score</Label>
                                        <Input
                                            id="speaking_band"
                                            type="number"
                                            step="0.5"
                                            required
                                            name="speaking_band"
                                            placeholder="e.g. 8.5"
                                        />
                                        <InputError message={errors.speaking_band} />
                                    </div>
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
