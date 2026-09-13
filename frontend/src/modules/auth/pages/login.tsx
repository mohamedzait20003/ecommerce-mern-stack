import { type FC, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { MailIcon } from 'lucide-react';

import { navUrls } from '@/lib/utils/navUrls';
import { Checkbox } from '@/common/components/ui/checkbox';
import { Field, FieldLabel } from '@/common/components/ui/field';
import { Shake } from '@/common/components/animation/shake';
import { useGoogleAuth, useLogin } from '@/lib/hooks/useUser';
import { apiErrorMessage } from '@/lib/utils/apiError';

import { AuthAlert } from '../components/auth-alert';
import { AuthCard } from '../components/auth-card';
import { AuthLink, AuthSwitch } from '../components/auth-links';
import { AuthShell } from '../components/auth-shell';
import { GooglePanel } from '../components/google-panel';
import { PasswordField } from '@/common/components/form/password-field';
import { SubmitButton } from '../components/submit-button';
import { TextField } from '@/common/components/form/text-field';

interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

const Login: FC = () => {
    // Counts rejections rather than flagging one: two bad passwords in a row
    // should shake twice, and a boolean that is already true cannot say that.
    const [rejections, setRejections] = useState(0);
    const shake = useCallback(() => setRejections((count) => count + 1), []);

    // The toasts and the redirect live in the hooks. What stays here is the
    // shake, which is this page's presentation and nothing the flow knows about.
    const { login, isLoading, error } = useLogin(shake);
    const {
        onSuccess: onGoogleSuccess,
        onError: onGoogleError,
        isLoading: isGoogleLoading,
    } = useGoogleAuth(shake);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        mode: 'onTouched',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const busy = isLoading || isGoogleLoading;

    const onSubmit = (data: LoginFormData) =>
        login({ email: data.email, password: data.password });

    return (
        <AuthShell showcase>
            <AuthCard
                title="Welcome back"
                description="Sign in to pick up your basket, track an order, or check on a return."
                footer={
                    <AuthSwitch
                        prompt="New here?"
                        to={navUrls.auth.signUp}
                        label="Create an account"
                    />
                }
            >
                <GooglePanel
                    onSuccess={onGoogleSuccess}
                    onError={onGoogleError}
                    dividerLabel="or use your email"
                    disabled={busy}
                />

                <Shake signal={rejections}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                        {error && (
                            <AuthAlert tone="error" title="We could not sign you in">
                                {apiErrorMessage(
                                    error,
                                    'Check your email and password, then try again.'
                                )}
                            </AuthAlert>
                        )}

                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: 'Enter the email you signed up with',
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
                                />
                            )}
                        />

                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: 'Enter your password',
                                minLength: { value: 6, message: 'Passwords are at least 6 characters' },
                            }}
                            render={({ field }) => (
                                <PasswordField
                                    {...field}
                                    label="Password"
                                    autoComplete="current-password"
                                    placeholder="Your password"
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Controller
                                name="rememberMe"
                                control={control}
                                render={({ field }) => (
                                    <Field orientation="horizontal" className="w-auto">
                                        <Checkbox
                                            id="remember-me"
                                            name={field.name}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            onBlur={field.onBlur}
                                        />
                                        <FieldLabel
                                            htmlFor="remember-me"
                                            className="cursor-pointer font-normal text-muted-foreground"
                                        >
                                            Keep me signed in
                                        </FieldLabel>
                                    </Field>
                                )}
                            />

                            <AuthLink to={navUrls.auth.passwordForgot} className="text-sm">
                                Forgot password?
                            </AuthLink>
                        </div>

                        <SubmitButton pending={busy} pendingLabel="Signing you in…">
                            Sign in
                        </SubmitButton>
                    </form>
                </Shake>
            </AuthCard>
        </AuthShell>
    );
};

export default Login;
