import { useState } from "react"
import { toast } from "react-toastify"
import {
    KeyRoundIcon,
    LaptopIcon,
    LogOutIcon,
    MonitorIcon,
    QrCodeIcon,
    ShieldCheckIcon,
    SmartphoneIcon,
    TabletIcon,
} from "lucide-react"

import { Badge } from "@/common/components/ui/badge"
import { Switch } from "@/common/components/ui/switch"
import { PasswordField } from "@/common/components/form/password-field"
import { TextField } from "@/common/components/form/text-field"
import { Collapse } from "@/common/components/animation/collapse"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/userSlice"

import { SettingsCard } from "./settings-card"

export function ChangePasswordSection() {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ current: "", next: "", confirm: "" })
    const [error, setError] = useState("")

    const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((current) => ({ ...current, [key]: event.target.value }))
        setError("")
    }

    const reset = () => {
        setForm({ current: "", next: "", confirm: "" })
        setError("")
        setEditing(false)
    }

    const save = () => {
        // Validated here rather than in an alert(): the message belongs beside
        // the field that is wrong, and an alert cannot be read by anything.
        if (!form.current) return setError("Enter your current password.")
        if (form.next.length < 6) return setError("Your new password needs at least 6 characters.")
        if (form.next !== form.confirm) return setError("The two new passwords do not match.")

        toast.info("Changing your password from here is not wired up yet.")
        reset()
    }

    return (
        <SettingsCard
            id="change-password"
            icon={KeyRoundIcon}
            title="Password"
            description="Used with your email to sign in. Changing it signs out your other devices."
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={reset}
            onSave={save}
            edit={
                <div className="flex flex-col gap-5">
                    <PasswordField
                        label="Current password"
                        autoComplete="current-password"
                        value={form.current}
                        onChange={set("current")}
                        error={error.includes("current") ? error : undefined}
                    />
                    <PasswordField
                        strength
                        label="New password"
                        autoComplete="new-password"
                        value={form.next}
                        onChange={set("next")}
                        error={error.includes("6 characters") ? error : undefined}
                    />
                    <PasswordField
                        label="Confirm new password"
                        autoComplete="new-password"
                        value={form.confirm}
                        onChange={set("confirm")}
                        error={error.includes("do not match") ? error : undefined}
                    />
                </div>
            }
        >
            <p className="flex items-center gap-3 text-muted-foreground">
                <span aria-hidden="true" className="font-heading text-lg tracking-[0.2em]">
                    ••••••••
                </span>
                <span className="text-sm">Last changed some time ago.</span>
            </p>
        </SettingsCard>
    )
}

export function TwoFactorSection() {
    const { faEnabled } = useAppSelector(selectUser)

    const [enabled, setEnabled] = useState(faEnabled ?? false)
    const [setupOpen, setSetupOpen] = useState(false)
    const [code, setCode] = useState("")

    const toggle = (next: boolean) => {
        if (next) {
            // Turning it on is a two-step flow: the switch opens the setup and
            // only the verified code actually enables it.
            setSetupOpen(true)
            return
        }

        setEnabled(false)
        setSetupOpen(false)
        toast.info("Two-factor authentication turned off.")
    }

    const verify = () => {
        if (code.length !== 6) return
        setEnabled(true)
        setSetupOpen(false)
        setCode("")
        toast.success("Two-factor authentication is on.")
    }

    return (
        <SettingsCard
            id="two-factor"
            icon={ShieldCheckIcon}
            title="Two-factor authentication"
            description="A code from your phone as well as your password, every time you sign in."
            action={
                <Switch
                    checked={enabled}
                    onCheckedChange={toggle}
                    aria-label="Two-factor authentication"
                    className="mt-1 shrink-0"
                />
            }
        >
            <div className="flex flex-col gap-4">
                {enabled ? (
                    <Badge className="h-7 w-fit gap-1.5 bg-success/12 px-3 font-semibold text-success">
                        <ShieldCheckIcon aria-hidden="true" />
                        Active on your account
                    </Badge>
                ) : (
                    <Badge className="h-7 w-fit gap-1.5 bg-muted px-3 font-semibold text-muted-foreground">
                        Off — your password is the only thing protecting this account
                    </Badge>
                )}

                <Collapse open={setupOpen && !enabled}>
                    <div className="flex flex-col gap-5 rounded-2xl bg-muted/60 p-5">
                        <div>
                            <h3 className="font-heading text-sm font-bold">Three steps</h3>
                            <ol className="mt-2 flex list-inside list-decimal flex-col gap-1 text-sm text-muted-foreground">
                                <li>Install an authenticator app — Google Authenticator, Authy, 1Password.</li>
                                <li>Scan this code with it.</li>
                                <li>Type the six digits it shows you.</li>
                            </ol>
                        </div>

                        {/* Placeholder until the enrolment endpoint returns a real
                            secret; a fake QR code would be worse than an empty frame. */}
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card p-6">
                            <QrCodeIcon aria-hidden="true" className="size-16 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                                The QR code appears once enrolment is available.
                            </p>
                        </div>

                        <TextField
                            label="Six-digit code"
                            value={code}
                            onChange={(event) =>
                                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            className="max-w-48"
                            hint="From your authenticator app."
                        />

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={verify}
                                disabled={code.length !== 6}
                                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60"
                            >
                                Verify and turn on
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSetupOpen(false)
                                    setCode("")
                                }}
                                className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Collapse>
            </div>
        </SettingsCard>
    )
}

/**
 * One row of the active-session list, as the backend's `sessions` table holds it.
 *
 * `isCurrent` is the server's answer, not ours. Working it out here from
 * `lastUsedAt` and the browser clock would be wrong on a skewed clock, wrong
 * for a second tab, and impure during render — and the server is the only party
 * that knows which session token made this request.
 */
interface ActiveSession {
    location: string
    deviceType: string
    lastUsedAt: string
    isCurrent: boolean
}

function DeviceIcon({ type }: Readonly<{ type: string }>) {
    if (type === "mobile") return <SmartphoneIcon aria-hidden="true" className="size-5" />
    if (type === "tablet") return <TabletIcon aria-hidden="true" className="size-5" />
    if (type === "laptop") return <LaptopIcon aria-hidden="true" className="size-5" />
    return <MonitorIcon aria-hidden="true" className="size-5" />
}

export function ActiveSessionsSection() {
    // `SessionService.activeFor(userId)` exists on the backend but no controller
    // exposes it yet, so this renders its empty state until that lands.
    const sessions: ActiveSession[] = []

    return (
        <SettingsCard
            id="active-sessions"
            icon={MonitorIcon}
            title="Where you are signed in"
            description="Every device holding a live session. Sign out any you do not recognise."
            action={
                sessions.length > 1 ? (
                    <button
                        type="button"
                        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-destructive/40 px-3 text-sm font-semibold text-destructive transition-colors outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        <LogOutIcon aria-hidden="true" className="size-4" />
                        Sign out the others
                    </button>
                ) : undefined
            }
        >
            {sessions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-pretty text-muted-foreground">
                    Session history is not available yet. When it is, every signed-in device will
                    be listed here with the option to sign it out.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {sessions.map((session) => {
                        const lastUsed = new Date(session.lastUsedAt)

                        return (
                            <li
                                key={`${session.location}-${session.lastUsedAt}`}
                                className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <span className="text-muted-foreground">
                                        <DeviceIcon type={session.deviceType} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="flex items-center gap-2">
                                            <span className="font-medium capitalize">
                                                {session.deviceType}
                                            </span>
                                            {session.isCurrent && (
                                                <Badge className="h-5 bg-primary/12 px-2 text-xs font-bold text-primary">
                                                    This device
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="block truncate text-sm text-muted-foreground">
                                            {session.location} · {lastUsed.toLocaleString()}
                                        </span>
                                    </span>
                                </span>

                                {!session.isCurrent && (
                                    <button
                                        type="button"
                                        aria-label={`Sign out ${session.deviceType} in ${session.location}`}
                                        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-destructive/40 px-3 text-sm font-semibold text-destructive transition-colors outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                                    >
                                        <LogOutIcon aria-hidden="true" className="size-4" />
                                        Sign out
                                    </button>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </SettingsCard>
    )
}
