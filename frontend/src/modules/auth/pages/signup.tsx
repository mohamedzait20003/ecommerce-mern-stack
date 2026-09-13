import { type FC, useCallback, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { AtSignIcon, CakeIcon, MailIcon, UserIcon } from 'lucide-react';

import { navUrls } from '@/lib/utils/navUrls';
import { Checkbox } from '@/common/components/ui/checkbox';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/common/components/ui/field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/common/components/ui/select';
import { Shake } from '@/common/components/animation/shake';
import { useGoogleAuth, useSignUp } from '@/lib/hooks/useUser';
import { apiErrorMessage } from '@/lib/utils/apiError';

import type { Gender } from '@/lib/models/userModels';

import { AuthAlert } from '../components/auth-alert';
import { AuthCard } from '../components/auth-card';
import { AuthLink, AuthSwitch } from '../components/auth-links';
import { AuthShell } from '../components/auth-shell';
import { GooglePanel } from '../components/google-panel';
import { PasswordField } from '@/common/components/form/password-field';
import { SubmitButton } from '../components/submit-button';
import { CONTROL_HEIGHT, TextField } from '@/common/components/form/text-field';

interface SignupFormData {
    fName: string;
    lName: string;
    username: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    password: string;
    passwordConfirmation: string;
    terms: boolean;
}

/** The select values, mapped onto the backend's Gender enum. */
const GENDERS: Record<string, Gender> = {
    male: 'MALE',
    female: 'FEMALE',
    other: 'OTHER',
    'prefer-not-to-say': 'PREFER_NOT_TO_SAY',
};

const GENDER_LABELS: [value: string, label: string][] = [
    ['male', 'Male'],
    ['female', 'Female'],
    ['other', 'Other'],
    ['prefer-not-to-say', 'Prefer not to say'],
];

const SignUp: FC = () => {
    const [rejections, setRejections] = useState(0);
    const shake = useCallback(() => setRejections((count) => count + 1), []);

    // The toasts and the redirect to the verification notice live in the hooks;
    // this page supplies the form and the shake.
    const { register, isLoading, error } = useSignUp(shake);
    const {
        onSuccess: onGoogleSuccess,
        onError: onGoogleError,
        isLoading: isGoogleLoading,
    } = useGoogleAuth(shake);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormData>({
        mode: 'onTouched',
        defaultValues: {
            fName: '',
            lName: '',
            username: '',
            email: '',
            gender: '',
            dateOfBirth: '',
            password: '',
            passwordConfirmation: '',
            terms: false,
        },
    });

    const password = watch('password');
    const busy = isLoading || isGoogleLoading;

    // Caps the native date picker at today, so a future birthday cannot even be
    // chosen — cheaper for the person filling it in than a validation message.
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

    // The confirmation is a form-only field: the backend takes the password
    // once, and the two are already checked against each other.
    const onSubmit = (data: SignupFormData) =>
        register({
            fname: data.fName,
            lname: data.lName,
            username: data.username,
            email: data.email,
            gender: GENDERS[data.gender],
            dateOfBirth: data.dateOfBirth,
            password: data.password,
        });

    return (
        <AuthShell showcase>
            <AuthCard
                title="Create your account"
                description="It takes about a minute, and you can check out as a guest any time you would rather not."
                footer={
                    <AuthSwitch
                        prompt="Already have an account?"
                        to={navUrls.auth.login}
                        label="Sign in"
                    />
                }
            >
                <GooglePanel
                    onSuccess={onGoogleSuccess}
                    onError={onGoogleError}
                    dividerLabel="or sign up with email"
                    disabled={busy}
                />

                <Shake signal={rejections}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
                        {error && (
                            <AuthAlert tone="error" title="We could not create your account">
                                {apiErrorMessage(
                                    error,
                                    'Check the details below and try again.'
                                )}
                            </AuthAlert>
                        )}

                        <FieldSet>
                            <FieldLegend variant="label">About you</FieldLegend>
                            <FieldGroup className="gap-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Controller
                                        name="fName"
                                        control={control}
                                        rules={{
                                            required: 'Enter your first name',
                                            minLength: { value: 2, message: 'At least 2 characters' },
                                            maxLength: { value: 100, message: 'At most 100 characters' },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="First name"
                                                autoComplete="given-name"
                                                placeholder="Jordan"
                                                icon={UserIcon}
                                                error={errors.fName?.message}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name="lName"
                                        control={control}
                                        rules={{
                                            required: 'Enter your last name',
                                            minLength: { value: 2, message: 'At least 2 characters' },
                                            maxLength: { value: 100, message: 'At most 100 characters' },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Last name"
                                                autoComplete="family-name"
                                                placeholder="Ellis"
                                                error={errors.lName?.message}
                                            />
                                        )}
                                    />
                                </div>

                                <Controller
                                    name="username"
                                    control={control}
                                    rules={{
                                        required: 'Pick a username',
                                        minLength: { value: 3, message: 'At least 3 characters' },
                                        maxLength: { value: 50, message: 'At most 50 characters' },
                                        pattern: {
                                            value: /^[a-zA-Z0-9_]+$/,
                                            message: 'Letters, numbers and underscores only',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Username"
                                            autoComplete="username"
                                            placeholder="jordanellis"
                                            icon={AtSignIcon}
                                            error={errors.username?.message}
                                            hint="This is the name sellers see on your reviews."
                                        />
                                    )}
                                />

                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: 'Enter your email address',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'That does not look like an email address',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Email address"
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            icon={MailIcon}
                                            error={errors.email?.message}
                                            hint="Order updates and your verification link go here."
                                        />
                                    )}
                                />

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Controller
                                        name="gender"
                                        control={control}
                                        rules={{ required: 'Choose an option' }}
                                        render={({ field }) => (
                                            <Field data-invalid={errors.gender ? 'true' : undefined}>
                                                <FieldLabel
                                                    htmlFor="signup-gender"
                                                    className="text-foreground"
                                                >
                                                    Gender
                                                </FieldLabel>
                                                <Select
                                                    name={field.name}
                                                    value={field.value || null}
                                                    onValueChange={(value) => field.onChange(value)}
                                                >
                                                    <SelectTrigger
                                                        id="signup-gender"
                                                        aria-invalid={
                                                            errors.gender ? true : undefined
                                                        }
                                                        className={`w-full ${CONTROL_HEIGHT}`}
                                                    >
                                                        <SelectValue placeholder="Select…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {GENDER_LABELS.map(([value, label]) => (
                                                            <SelectItem key={value} value={value}>
                                                                {label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FieldError>{errors.gender?.message}</FieldError>
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="dateOfBirth"
                                        control={control}
                                        rules={{
                                            required: 'Enter your date of birth',
                                            validate: (value) => {
                                                const date = new Date(value);
                                                const now = new Date();
                                                const age = now.getFullYear() - date.getFullYear();
                                                if (age < 13) return 'You must be at least 13 to sign up';
                                                if (age > 120) return 'Check that date — it does not look right';
                                                return true;
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Date of birth"
                                                type="date"
                                                max={today}
                                                autoComplete="bday"
                                                icon={CakeIcon}
                                                error={errors.dateOfBirth?.message}
                                            />
                                        )}
                                    />
                                </div>
                            </FieldGroup>
                        </FieldSet>

                        <FieldSet>
                            <FieldLegend variant="label">Security</FieldLegend>
                            <FieldGroup className="gap-5">
                                <Controller
                                    name="password"
                                    control={control}
                                    rules={{
                                        required: 'Choose a password',
                                        minLength: { value: 6, message: 'At least 6 characters' },
                                        maxLength: { value: 100, message: 'At most 100 characters' },
                                    }}
                                    render={({ field }) => (
                                        <PasswordField
                                            {...field}
                                            strength
                                            label="Password"
                                            autoComplete="new-password"
                                            placeholder="At least 6 characters"
                                            error={errors.password?.message}
                                        />
                                    )}
                                />

                                <Controller
                                    name="passwordConfirmation"
                                    control={control}
                                    rules={{
                                        required: 'Type your password again',
                                        validate: (value) =>
                                            value === password || 'These two do not match',
                                    }}
                                    render={({ field }) => (
                                        <PasswordField
                                            {...field}
                                            label="Confirm password"
                                            autoComplete="new-password"
                                            placeholder="Type it again"
                                            error={errors.passwordConfirmation?.message}
                                        />
                                    )}
                                />
                            </FieldGroup>
                        </FieldSet>

                        <Controller
                            name="terms"
                            control={control}
                            rules={{ required: 'Please accept the terms to continue' }}
                            render={({ field }) => (
                                <Field
                                    orientation="horizontal"
                                    data-invalid={errors.terms ? 'true' : undefined}
                                    className="items-start"
                                >
                                    <Checkbox
                                        id="signup-terms"
                                        name={field.name}
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        onBlur={field.onBlur}
                                        aria-invalid={errors.terms ? true : undefined}
                                        aria-describedby={
                                            errors.terms ? 'signup-terms-error' : undefined
                                        }
                                        className="mt-0.5"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <FieldLabel
                                            htmlFor="signup-terms"
                                            className="cursor-pointer font-normal text-pretty text-muted-foreground"
                                        >
                                            <span>
                                                I agree to the{' '}
                                                <AuthLink to={navUrls.common.terms}>
                                                    Terms of Service
                                                </AuthLink>{' '}
                                                and{' '}
                                                <AuthLink to={navUrls.common.privacy}>
                                                    Privacy Policy
                                                </AuthLink>
                                                .
                                            </span>
                                        </FieldLabel>
                                        <FieldError id="signup-terms-error">
                                            {errors.terms?.message}
                                        </FieldError>
                                    </div>
                                </Field>
                            )}
                        />

                        <SubmitButton pending={busy} pendingLabel="Creating your account…">
                            Create account
                        </SubmitButton>
                    </form>
                </Shake>
            </AuthCard>
        </AuthShell>
    );
};

export default SignUp;
