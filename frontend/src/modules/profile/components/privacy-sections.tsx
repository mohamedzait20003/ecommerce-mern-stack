import { useState } from "react"
import { toast } from "react-toastify"
import { BellIcon, DownloadIcon, EyeIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/common/components/ui/alert-dialog"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/userSlice"

import { SettingsCard } from "./settings-card"
import { ToggleRow } from "./toggle-row"

export function DataManagementSection() {
    return (
        <SettingsCard
            id="data-management"
            icon={DownloadIcon}
            title="Your data"
            description="Take a copy of everything we hold, or close the account for good."
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4">
                    <div className="min-w-0">
                        <h3 className="font-medium">Download a copy</h3>
                        <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                            Profile, orders, addresses and preferences, as a single file. It
                            arrives by email within a day.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => toast.info("Data export is not wired up yet.")}
                        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        <DownloadIcon aria-hidden="true" className="size-4" />
                        Request a copy
                    </button>
                </div>

                {/* Set apart, in the danger colour, at the bottom: the one action
                    here that cannot be undone should not sit next to a download. */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-destructive/30 bg-destructive/6 p-4">
                    <div className="min-w-0">
                        <h3 className="font-medium text-destructive">Close this account</h3>
                        <p className="mt-0.5 text-sm text-pretty text-destructive/85">
                            Deletes your profile and preferences. Order records are kept for seven
                            years, as tax law requires.
                        </p>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger
                            render={
                                <button
                                    type="button"
                                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-destructive/40 px-4 text-sm font-semibold text-destructive transition-colors outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                                />
                            }
                        >
                            <Trash2Icon aria-hidden="true" className="size-4" />
                            Close account
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <TriangleAlertIcon
                                        aria-hidden="true"
                                        className="size-5 text-destructive"
                                    />
                                    Close your account?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This cannot be undone. Your profile, saved addresses and
                                    preferences are deleted, and any basket you have is emptied.
                                    Orders already placed still arrive.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep my account</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() =>
                                        toast.info("Account closure is not wired up yet.")
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Yes, close it
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </SettingsCard>
    )
}

export function AccountRightsSection() {
    const profile = useAppSelector(selectUser).customerProfile

    const [editing, setEditing] = useState(false)
    const [settings, setSettings] = useState({
        activity: profile?.isActivityTracked ?? false,
        sharing: profile?.isDataShared ?? false,
    })

    const rows = (readOnly: boolean) => (
        <div className="flex flex-col gap-3">
            <ToggleRow
                label="Personalise what I see"
                description="Uses what you browse to order the shop and pick the deals we show you."
                checked={settings.activity}
                onCheckedChange={(activity) => setSettings((s) => ({ ...s, activity }))}
                readOnly={readOnly}
            />
            <ToggleRow
                label="Share data with partners"
                description="Off by default, and it stays off unless you turn it on here."
                checked={settings.sharing}
                onCheckedChange={(sharing) => setSettings((s) => ({ ...s, sharing }))}
                readOnly={readOnly}
            />
        </div>
    )

    return (
        <SettingsCard
            id="account-rights"
            icon={EyeIcon}
            title="Tracking and personalisation"
            description="What we may work out about you from how you use the shop."
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={() => {
                setSettings({
                    activity: profile?.isActivityTracked ?? false,
                    sharing: profile?.isDataShared ?? false,
                })
                setEditing(false)
            }}
            onSave={() => {
                toast.info("Saving privacy settings is not wired up yet.")
                setEditing(false)
            }}
            edit={rows(false)}
        >
            {rows(true)}
        </SettingsCard>
    )
}

export function NotificationSettingsSection() {
    const profile = useAppSelector(selectUser).customerProfile

    const [editing, setEditing] = useState(false)
    const [settings, setSettings] = useState({
        email: profile?.isEmailNotified ?? true,
        security: profile?.isSecurityNotified ?? true,
        updates: profile?.isUpdateNotified ?? true,
    })

    const rows = (readOnly: boolean) => (
        <div className="flex flex-col gap-3">
            <ToggleRow
                label="Order emails"
                description="Confirmations, dispatch notices and refunds. These are not marketing."
                checked={settings.email}
                onCheckedChange={(email) => setSettings((s) => ({ ...s, email }))}
                readOnly={readOnly}
            />
            <ToggleRow
                label="Security alerts"
                description="A new sign-in, a password change, or anything else worth knowing about fast."
                checked={settings.security}
                onCheckedChange={(security) => setSettings((s) => ({ ...s, security }))}
                readOnly={readOnly}
            />
            <ToggleRow
                label="Account updates"
                description="Changes to your details, and to the terms you agreed to."
                checked={settings.updates}
                onCheckedChange={(updates) => setSettings((s) => ({ ...s, updates }))}
                readOnly={readOnly}
            />
        </div>
    )

    return (
        <SettingsCard
            id="notification-settings"
            icon={BellIcon}
            title="What we email you"
            description="Order updates cannot be switched off while an order is live."
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={() => {
                setSettings({
                    email: profile?.isEmailNotified ?? true,
                    security: profile?.isSecurityNotified ?? true,
                    updates: profile?.isUpdateNotified ?? true,
                })
                setEditing(false)
            }}
            onSave={() => {
                toast.info("Saving notification settings is not wired up yet.")
                setEditing(false)
            }}
            edit={rows(false)}
        >
            {rows(true)}
        </SettingsCard>
    )
}
