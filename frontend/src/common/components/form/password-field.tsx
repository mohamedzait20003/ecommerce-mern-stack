import { useState } from "react"
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react"

import { PasswordStrength } from "./password-strength"
import { TextField, type TextFieldProps } from "./text-field"

type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing" | "icon"> & {
    /** Show the live strength meter under the control. Sign-up only. */
    strength?: boolean
}

/**
 * A password input with a reveal toggle.
 *
 * The toggle exists because the alternative is people typing their password
 * into the username box to check it. Its label changes with its state, so it is
 * never just "toggle password" — a screen reader hears what pressing it will
 * do. The hit area is stretched past the icon with `after`, matching how the
 * checkbox primitive does it, so a 40px glyph still clears 44px to tap.
 */
export function PasswordField({ strength, value, ...props }: Readonly<PasswordFieldProps>) {
    const [visible, setVisible] = useState(false)
    const Icon = visible ? EyeOffIcon : EyeIcon

    return (
        <div className="flex flex-col gap-2.5">
            <TextField
                {...props}
                value={value}
                type={visible ? "text" : "password"}
                icon={LockIcon}
                trailing={
                    <button
                        type="button"
                        onClick={() => setVisible(!visible)}
                        aria-pressed={visible}
                        aria-label={visible ? "Hide password" : "Show password"}
                        className="relative flex size-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none after:absolute after:-inset-1 hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        <Icon aria-hidden="true" className="size-4.5" />
                    </button>
                }
            />

            {strength && typeof value === "string" && value.length > 0 && (
                <PasswordStrength value={value} />
            )}
        </div>
    )
}
