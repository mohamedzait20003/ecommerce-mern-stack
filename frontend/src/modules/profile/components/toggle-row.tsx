import { useId, type ReactNode } from "react"

import { Switch } from "@/common/components/ui/switch"
import { cn } from "@/lib/utils/utils"

/**
 * One on/off preference.
 *
 * The whole row is the label, so the target is the row rather than a 20px
 * switch — and the switch itself is the real control, with the state it
 * announces coming from the primitive rather than from a word beside it that
 * could drift out of sync.
 *
 * `readOnly` dims the row without disabling the switch's semantics, because a
 * setting you are not currently editing is not a setting you are forbidden.
 */
export function ToggleRow({
    label,
    description,
    checked,
    onCheckedChange,
    readOnly = false,
}: Readonly<{
    label: string
    description?: ReactNode
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    readOnly?: boolean
}>) {
    const id = useId()

    return (
        <label
            htmlFor={id}
            className={cn(
                "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border p-4",
                "transition-colors",
                readOnly ? "cursor-default bg-muted/40" : "hover:bg-muted/60"
            )}
        >
            <span className="min-w-0">
                <span className="block font-medium">{label}</span>
                {description && (
                    <span className="mt-0.5 block text-sm text-pretty text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>

            <Switch
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={readOnly}
                className="mt-1 shrink-0"
            />
        </label>
    )
}
