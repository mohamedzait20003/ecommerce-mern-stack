import { type FC, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { KeyRoundIcon, MailIcon } from 'lucide-react';

import { navUrls } from '@/lib/utils/navUrls';
import { Shake } from '@/common/components/animation/shake';
import { Swap } from '@/common/components/animation/swap';
import { usePasswordForgot } from '@/lib/hooks/useUser';
import { apiErrorMessage } from '@/lib/utils/apiError';

import { AuthAlert } from '../components/auth-alert';
import { AuthCard } from '../components/auth-card';
import { AuthSecondaryLink, AuthSwitch } from '../components/auth-links';
import { AuthOutcome } from '../components/auth-outcome';
import { AuthShell } from '../components/auth-shell';
import { SubmitButton } from '../components/submit-button';
import { TextField } from '@/common/components/form/text-field';

interface ForgotPasswordFormData {
    email: string;
}

const PassForgot: FC = () => {
    const [rejections, setRejections] = useState(0);
    const shake = useCallback(() => setRejections((count) => count + 1), []);

    const { requestReset, isLoading, isSuccess, error } = usePasswordForgot(shake);

    const [sentTo, setSentTo] = useState('');
    // Lets someone who mistyped the address get the form back. The mutation's
    // own success flag has no reason to un-set itself, so this overrides it.
    const [editing, setEditing] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        mode: 'onTouched',
        defaultValues: { email: '' },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setSentTo(data.email);
        setEditing(false);
        await requestReset({ email: data.email });
    };

    const sent = isSuccess && !editing;

    // Once the mail is away the form has nothing left to do, so it is replaced
    // rather than left under a success banner inviting a second send.
    return (
        <AuthShell>
            <Swap swapKey={sent ? 'sent' : 'form'}>
                {sent ? (
                    <AuthOutcome
                        kind="mail"
                        tone="info"
                        markLabel="Email sent"
                        title="Check your inbox"
                        description={`If ${sentTo || 'that address'} has an account with us, a reset link is on its way. It is good for one hour.`}
                        actions={
                            <>
                                <AuthSecondaryLink to={navUrls.auth.login}>
                                    Back to sign in
                                </AuthSecondaryLink>
                                <p className="text-sm text-pretty text-muted-foreground">
                                    Nothing after a few minutes? Check your spam folder, or{' '}
                                    <button
                                        type="button"
                                        onClick={() => setEditing(true)}
                                        className="cursor-pointer rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/40"
                                    >
                                        try a different address
                                    </button>
                                    .
                                </p>
                            </>
                        }
                    />
                ) : (
                    <AuthCard
                        icon={KeyRoundIcon}
                        title="Forgot your password?"
                        description="Give us the email on your account and we will send you a link to set a new one."
                        footer={
                            <AuthSwitch
                                prompt="Remembered it?"
                                to={navUrls.auth.login}
                                label="Back to sign in"
                            />
                        }
                    >
                        <Shake signal={rejections}>
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                                {error && (
                                    <AuthAlert tone="error" title="We could not send that link">
                                        {apiErrorMessage(
                                            error,
                                            'Check the address and try again in a moment.'
                                        )}
                                    </AuthAlert>
                                )}

                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: 'Enter the email on your account',
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
                                            hint="We will only email the address you signed up with."
                                        />
                                    )}
                                />

                                <SubmitButton pending={isLoading} pendingLabel="Sending the link…">
                                    Send reset link
                                </SubmitButton>
                            </form>
                        </Shake>
                    </AuthCard>
                )}
            </Swap>
        </AuthShell>
    );
};

export default PassForgot;
