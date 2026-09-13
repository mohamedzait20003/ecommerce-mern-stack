import { type FC, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ShieldCheckIcon } from 'lucide-react';

import { navUrls } from '@/lib/utils/navUrls';
import { Shake } from '@/common/components/animation/shake';
import { usePasswordReset } from '@/lib/hooks/useUser';
import { apiErrorMessage } from '@/lib/utils/apiError';

import { AuthAlert } from '../components/auth-alert';
import { AuthCard } from '../components/auth-card';
import { AuthLink, AuthSwitch } from '../components/auth-links';
import { AuthShell } from '../components/auth-shell';
import { PasswordField } from '@/common/components/form/password-field';
import { SubmitButton } from '../components/submit-button';

interface PasswordChangeFormData {
    password: string;
    passwordConfirmation: string;
}

const PassChange: FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [rejections, setRejections] = useState(0);
    const shake = useCallback(() => setRejections((count) => count + 1), []);

    const { resetPassword, isLoading, error } = usePasswordReset(shake);

    const {
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PasswordChangeFormData>({
        mode: 'onTouched',
        defaultValues: {
            password: '',
            passwordConfirmation: '',
        },
    });

    const password = watch('password');

    const onSubmit = (data: PasswordChangeFormData) => {
        // The submit button is already disabled without a token; this is the
        // guard for a form submitted by pressing Enter in a field.
        if (!token) return;

        return resetPassword({
            token,
            password: data.password,
            passwordConfirmation: data.passwordConfirmation,
        });
    };

    return (
        <AuthShell>
            <AuthCard
                icon={ShieldCheckIcon}
                title="Set a new password"
                description="Pick something you have not used here before. You will be signed out of other devices."
                footer={
                    <AuthSwitch
                        prompt="Changed your mind?"
                        to={navUrls.auth.login}
                        label="Back to sign in"
                    />
                }
            >
                <Shake signal={rejections}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                        {/* The token problem comes first: without it nothing on this
                            page can succeed, and the recovery is a different page. */}
                        {!token && (
                            <AuthAlert tone="warning" title="This link is incomplete">
                                It is missing its reset token, so we cannot tell whose password to
                                change. Request a fresh link from{' '}
                                <AuthLink to={navUrls.auth.passwordForgot}>
                                    Forgot your password
                                </AuthLink>
                                .
                            </AuthAlert>
                        )}

                        {error && (
                            <AuthAlert tone="error" title="We could not change your password">
                                {apiErrorMessage(
                                    error,
                                    'The link may have expired. Request a new one and try again.'
                                )}
                            </AuthAlert>
                        )}

                        <Controller
                            name="password"
                            control={control}
                            rules={{
                                required: 'Choose a new password',
                                minLength: { value: 6, message: 'At least 6 characters' },
                                maxLength: { value: 100, message: 'At most 100 characters' },
                            }}
                            render={({ field }) => (
                                <PasswordField
                                    {...field}
                                    strength
                                    label="New password"
                                    autoComplete="new-password"
                                    placeholder="At least 6 characters"
                                    disabled={!token}
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <Controller
                            name="passwordConfirmation"
                            control={control}
                            rules={{
                                required: 'Type your new password again',
                                validate: (value) => value === password || 'These two do not match',
                            }}
                            render={({ field }) => (
                                <PasswordField
                                    {...field}
                                    label="Confirm new password"
                                    autoComplete="new-password"
                                    placeholder="Type it again"
                                    disabled={!token}
                                    error={errors.passwordConfirmation?.message}
                                />
                            )}
                        />

                        <SubmitButton
                            pending={isLoading}
                            disabled={!token}
                            pendingLabel="Changing your password…"
                        >
                            Change password
                        </SubmitButton>
                    </form>
                </Shake>
            </AuthCard>
        </AuthShell>
    );
};

export default PassChange;
