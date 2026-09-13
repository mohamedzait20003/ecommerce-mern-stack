import { CheckIcon } from "lucide-react"

import { Progress } from "@/common/components/ui/progress"
import { cn } from "@/lib/utils/utils"

/**
 * What actually makes a password hard to guess, in the order that matters.
 * Length first, because it beats every character-class rule ever written.
 */
const RULES = [
    { label: "8 characters or more", test: (value: string) => value.length >= 8 },
    { label: "A capital and a lowercase letter", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: "A number", test: (value: string) => /\d/.test(value) },
    { label: "A symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const

/**
 * Written out in full rather than composed from a colour name: Tailwind scans
 * this file as text, and a class it never sees spelled out is a class it never
 * generates.
 */
const BANDS = [
    { label: "Too short", tone: "text-destructive", bar: "[&_[data-slot=progress-indicator]]:bg-destructive" },
    { label: "Weak", tone: "text-destructive", bar: "[&_[data-slot=progress-indicator]]:bg-destructive" },
    { label: "Fair", tone: "text-warning", bar: "[&_[data-slot=progress-indicator]]:bg-warning" },
    { label: "Good", tone: "text-info", bar: "[&_[data-slot=progress-indicator]]:bg-info" },
    { label: "Strong", tone: "text-success", bar: "[&_[data-slot=progress-indicator]]:bg-success" },
] as const

function scorePassword(value: string) {
    return RULES.reduce((score, rule) => score + (rule.test(value) ? 1 : 0), 0)
}

/**
 * How strong the password being typed is.
 *
 * Advisory, not a gate — the form's own rules decide what is accepted. The
 * point is to answer "is this good enough?" while there is still time to change
 * the answer, which a validation message after submit cannot do.
 *
 * The band is named as well as coloured, and each unmet rule stays listed
 * rather than disappearing, so the requirements never become a guessing game.
 */
export function PasswordStrength({ value, className }: Readonly<{ value: string; className?: string }>) {
    const score = scorePassword(value)
    const band = BANDS[score]

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex items-center justify-between gap-3">
                <Progress
                    value={(score / RULES.length) * 100}
                    aria-label="Password strength"
                    className={cn(
                        "flex-1 gap-0",
                        "[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-foreground/10",
                        band.bar
                    )}
                />
                {/* Announced on change, so the band is available without sight
                    of the bar — but politely, mid-typing. */}
                <span
                    aria-live="polite"
                    className={cn("text-xs font-bold tabular-nums", band.tone)}
                >
                    {band.label}
                </span>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {RULES.map(({ label, test }) => {
                    const met = test(value)
                    return (
                        <li
                            key={label}
                            className={cn(
                                "flex items-center gap-1.5 text-xs",
                                met ? "text-success" : "text-muted-foreground"
                            )}
                        >
                            <CheckIcon
                                aria-hidden="true"
                                className={cn("size-3.5", !met && "opacity-30")}
                            />
                            <span className="sr-only">{met ? "Met: " : "Not yet met: "}</span>
                            {label}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
