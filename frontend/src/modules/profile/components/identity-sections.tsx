import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import {
    AtSignIcon,
    CakeIcon,
    CameraIcon,
    GlobeIcon,
    ImageIcon,
    MailIcon,
    UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar"
import { Spinner } from "@/common/components/ui/spinner"
import { TextField } from "@/common/components/form/text-field"
import { useUpdatePictureMutation } from "@/lib/handlers/userHandlers"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/userSlice"

import { SettingsCard, ValueList, ValueRow } from "./settings-card"

/**
 * Nothing below saves yet.
 *
 * `updatePicture` is the only profile mutation the API exposes; the rest of
 * these fields have no endpoint behind them. Rather than pretend, each form
 * says so on save and leaves the values where they were — swap the body for the
 * mutation when `PATCH /api/profile` lands and the UI above is already right.
 */
function notImplemented() {
    toast.info("Saving profile details is not wired up yet.")
}

export function ProfilePictureSection() {
    const { profilePicURL, firstName, lastName, username } = useAppSelector(selectUser)
    const [updatePicture, { isLoading }] = useUpdatePictureMutation()

    const [editing, setEditing] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    // Revoked implicitly when the component unmounts with the object URL
    // unused; kept in a memo so a re-render does not mint a second one.
    const preview = useMemo(
        () => (file ? URL.createObjectURL(file) : profilePicURL || null),
        [file, profilePicURL]
    )

    const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim() || username.slice(0, 2)

    const save = async () => {
        if (!file) {
            toast.error("Choose an image first.")
            return
        }

        try {
            await updatePicture({ picture: file }).unwrap()
            toast.success("Photo updated.")
        } catch (error) {
            console.error("Error uploading profile picture:", error)
            toast.error("We could not upload that image. Please try again.")
        } finally {
            setEditing(false)
            setFile(null)
        }
    }

    return (
        <SettingsCard
            id="picture"
            icon={ImageIcon}
            title="Profile photo"
            description="Shown on your reviews and beside any message you send a seller."
            editing={editing}
            saving={isLoading}
            onEdit={() => setEditing(true)}
            onCancel={() => {
                setEditing(false)
                setFile(null)
            }}
            onSave={save}
            edit={
                <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-within:ring-3 focus-within:ring-ring/40">
                        <CameraIcon aria-hidden="true" className="size-4" />
                        Choose an image
                        <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                        />
                    </label>

                    <p aria-live="polite" className="text-sm text-muted-foreground">
                        {file ? file.name : "JPEG or PNG, up to about 5MB."}
                    </p>
                </div>
            }
        >
            <div className="flex items-center gap-5">
                <Avatar className="size-20 ring-2 ring-border">
                    {preview && <AvatarImage src={preview} alt="" />}
                    <AvatarFallback className="font-heading text-lg font-bold uppercase">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <p className="text-sm text-pretty text-muted-foreground">
                    {profilePicURL
                        ? "Your photo is set. Edit to replace it."
                        : "No photo yet — your initials are shown instead."}
                    {isLoading && (
                        <span className="mt-2 flex items-center gap-2">
                            <Spinner aria-hidden="true" className="size-4" />
                            Uploading…
                        </span>
                    )}
                </p>
            </div>
        </SettingsCard>
    )
}

export function PersonalInformationSection() {
    const { firstName, lastName, dateOfBirth, gender } = useAppSelector(selectUser)

    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        firstName: firstName || "",
        lastName: lastName || "",
        dateOfBirth: dateOfBirth || "",
        gender: gender || "",
    })

    const reset = () => {
        setForm({
            firstName: firstName || "",
            lastName: lastName || "",
            dateOfBirth: dateOfBirth || "",
            gender: gender || "",
        })
        setEditing(false)
    }

    const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((current) => ({ ...current, [key]: event.target.value }))

    return (
        <SettingsCard
            id="personal"
            icon={UserIcon}
            title="Personal details"
            description="Your name as it appears on orders, and the date we use to check age limits."
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={reset}
            onSave={() => {
                notImplemented()
                setEditing(false)
            }}
            edit={
                <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                        label="First name"
                        value={form.firstName}
                        onChange={set("firstName")}
                        autoComplete="given-name"
                        icon={UserIcon}
                    />
                    <TextField
                        label="Last name"
                        value={form.lastName}
                        onChange={set("lastName")}
                        autoComplete="family-name"
                    />
                    <TextField
                        label="Date of birth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={set("dateOfBirth")}
                        autoComplete="bday"
                        icon={CakeIcon}
                    />
                    <TextField
                        label="Gender"
                        value={form.gender}
                        onChange={set("gender")}
                        hint="Optional, and never shown to sellers."
                    />
                </div>
            }
        >
            <ValueList>
                <ValueRow label="First name" value={firstName} />
                <ValueRow label="Last name" value={lastName} />
                <ValueRow label="Date of birth" value={dateOfBirth} />
                <ValueRow label="Gender" value={gender} empty="Not given" />
            </ValueList>
        </SettingsCard>
    )
}

export function AccountInformationSection() {
    const { username, email } = useAppSelector(selectUser)

    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({ username: username || "", email: email || "" })

    const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((current) => ({ ...current, [key]: event.target.value }))

    return (
        <SettingsCard
            id="account"
            icon={AtSignIcon}
            title="Account"
            description="How you sign in, and where order updates are sent."
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={() => {
                setForm({ username: username || "", email: email || "" })
                setEditing(false)
            }}
            onSave={() => {
                notImplemented()
                setEditing(false)
            }}
            edit={
                <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                        label="Username"
                        value={form.username}
                        onChange={set("username")}
                        autoComplete="username"
                        icon={AtSignIcon}
                        hint="Letters, numbers and underscores."
                    />
                    <TextField
                        label="Email address"
                        type="email"
                        inputMode="email"
                        value={form.email}
                        onChange={set("email")}
                        autoComplete="email"
                        icon={MailIcon}
                        hint="Changing this needs a fresh verification link."
                    />
                </div>
            }
        >
            <ValueList>
                <ValueRow label="Username" value={username && `@${username}`} />
                <ValueRow label="Email address" value={email} />
            </ValueList>
        </SettingsCard>
    )
}

export function PreferencesSection() {
    const { locale, timeZone } = useAppSelector(selectUser)

    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState({
        locale: locale || "en-GB",
        timeZone: timeZone || "UTC",
    })

    const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((current) => ({ ...current, [key]: event.target.value }))

    return (
        <SettingsCard
            id="preferences"
            icon={GlobeIcon}
            title="Language and time"
            description="What we format prices, dates and delivery windows in."
            editing={editing}
            onEdit={() => setEditing(true)}
            onCancel={() => {
                setForm({ locale: locale || "en-GB", timeZone: timeZone || "UTC" })
                setEditing(false)
            }}
            onSave={() => {
                notImplemented()
                setEditing(false)
            }}
            edit={
                <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                        label="Language"
                        value={form.locale}
                        onChange={set("locale")}
                        icon={GlobeIcon}
                        hint="A locale code, such as en-GB or de-DE."
                    />
                    <TextField
                        label="Time zone"
                        value={form.timeZone}
                        onChange={set("timeZone")}
                        hint="An IANA name, such as Europe/London."
                    />
                </div>
            }
        >
            <ValueList>
                <ValueRow label="Language" value={locale} empty="Using your browser's" />
                <ValueRow label="Time zone" value={timeZone} empty="Using your device's" />
            </ValueList>
        </SettingsCard>
    )
}
