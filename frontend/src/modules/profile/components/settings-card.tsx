import type { ComponentType, ReactNode, SVGProps } from "react"
import { CheckIcon, PencilIcon, XIcon } from "lucide-react"

import { Card, CardContent } from "@/common/components/ui/card"
import { Spinner } from "@/common/components/ui/spinner"
import { Collapse } from "@/common/components/animation/collapse"
import { Highlight } from "@/common/components/animation/highlight"
import { cn } from "@/lib/utils/utils"

type SettingsCardProps = {
    /** Anchor id. The section nav links to it and `:target` flashes it. */
    id: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    title: string
    description?: string
    /** What the setting currently is, in plain text. */
    children: ReactNode
    /** The form. Omit for a card that is read-only or acts through its own controls. */
    edit?: ReactNode
    editing?: boolean
    onEdit?: () => void
    onCancel?: () => void
    onSave?: () => void
    saving?: boolean
    /** Replaces the edit pencil, e.g. a switch that acts immediately. */
    action?: ReactNode
    tone?: "default" | "danger"
}

/**
 * One setting, in a card.
 *
 * Ten sections used to hand-roll the same header, the same pencil, and the same
 * Save/Cancel pair, which is ten chances for them to disagree. This owns all of
 * it, so a change to how editing looks is one edit rather than ten.
 *
 * Read and edit are two views rather than one form that toggles `disabled`: a
 * disabled input looks broken and reads as "you may not change this", when the
 * truth is "this is what it is". Both stay mounted and swap by collapsing into
 * each other, so a half-typed form survives an accidental cancel-and-reopen and
 * the card grows into its new height instead of snapping.
 */
export function SettingsCard({
    id,
    icon: Icon,
    title,
    description,
    children,
    edit,
    editing = false,
    onEdit,
    onCancel,
    onSave,
    saving = false,
    action,
    tone = "default",
}: Readonly<SettingsCardProps>) {
    const danger = tone === "danger"

    return (
        <Highlight id={id}>
            <Card
                className={cn(
                    "border transition-shadow duration-300 hover:shadow-md",
                    danger ? "border-destructive/30" : "border-border"
                )}
            >
                <CardContent className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-4">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                                    danger
                                        ? "bg-destructive/12 text-destructive"
                                        : "bg-primary/10 text-primary"
                                )}
                            >
                                <Icon className="size-5" />
                            </span>

                            <div className="min-w-0">
                                <h2 className="font-heading text-base font-bold text-balance">
                                    {title}
                                </h2>
                                {description && (
                                    <p className="mt-1 text-sm text-pretty text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {action ??
                            (edit && !editing && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    aria-label={`Edit ${title.toLowerCase()}`}
                                    className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors outline-none after:absolute after:-inset-1 hover:bg-primary/10 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    <PencilIcon aria-hidden="true" className="size-4.5" />
                                </button>
                            ))}
                    </div>

                    {/* One closes as the other opens, so the card resizes once. */}
                    {edit ? (
                        <>
                            <Collapse open={!editing}>
                                <div className="pt-1">{children}</div>
                            </Collapse>

                            <Collapse open={editing}>
                                <div className="flex flex-col gap-5 pt-1">
                                    {edit}

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={onSave}
                                            disabled={saving}
                                            aria-busy={saving}
                                            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60"
                                        >
                                            {saving ? (
                                                <Spinner aria-hidden="true" className="size-4" />
                                            ) : (
                                                <CheckIcon aria-hidden="true" className="size-4" />
                                            )}
                                            {saving ? "Saving…" : "Save changes"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={onCancel}
                                            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                                        >
                                            <XIcon aria-hidden="true" className="size-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </Collapse>
                        </>
                    ) : (
                        children
                    )}
                </CardContent>
            </Card>
        </Highlight>
    )
}

/**
 * One stored value, read-only.
 *
 * A definition list rather than a disabled input: the value is a fact about the
 * account, and rendering it as a greyed-out control says it is a form that has
 * been taken away.
 */
export function ValueList({ children }: Readonly<{ children: ReactNode }>) {
    return <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
}

export function ValueRow({
    label,
    value,
    empty = "Not set",
}: Readonly<{ label: string; value?: ReactNode; empty?: string }>) {
    const filled = value !== undefined && value !== null && value !== ""

    return (
        <div className="min-w-0">
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd className={cn("mt-1 truncate", !filled && "text-muted-foreground italic")}>
                {filled ? value : empty}
            </dd>
        </div>
    )
}
