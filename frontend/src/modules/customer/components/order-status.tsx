import { Badge } from "@/common/components/ui/badge"
import { cn } from "@/lib/utils/utils"
import type { OrderStatus } from "./customer-data"
import { STATUS, STEPS } from "./order-status-data"

/**
 * Where an order is, as a badge.
 *
 * Icon plus word plus colour: the same status is legible on a monochrome
 * screen, to someone who cannot separate red from green, and at a glance.
 */
export function StatusBadge({
    status,
    className,
}: Readonly<{ status: OrderStatus; className?: string }>) {
    const { label, icon: Icon, badge } = STATUS[status]

    return (
        <Badge className={cn("h-6 gap-1.5 px-2.5 font-semibold", badge, className)}>
            <Icon aria-hidden="true" />
            {label}
        </Badge>
    )
}

/**
 * The journey so far, as four connected steps.
 *
 * Rendered as an ordered list with the current step marked `aria-current`, so
 * it reads as a sequence with a position rather than as four loose icons. An
 * order that stopped early shows its ending instead — the timeline would be a
 * lie, and a cancelled order has no next step to look forward to.
 */
export function OrderTimeline({
    status,
    className,
}: Readonly<{ status: OrderStatus; className?: string }>) {
    const current = STATUS[status].step

    if (current === -1) {
        const { icon: Icon, badge } = STATUS[status]
        return (
            <p
                className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                    badge,
                    className
                )}
            >
                <Icon aria-hidden="true" className="size-4" />
                {status === "CANCELLED"
                    ? "This order was cancelled and refunded in full."
                    : "This order came back to the seller and has been refunded."}
            </p>
        )
    }

    return (
        <ol className={cn("flex items-start", className)}>
            {STEPS.map((step, index) => {
                const meta = STATUS[step]
                const done = index <= current
                const isCurrent = index === current

                return (
                    <li
                        key={step}
                        aria-current={isCurrent ? "step" : undefined}
                        className="flex flex-1 flex-col items-center gap-2 text-center last:flex-none"
                    >
                        <span className="flex w-full items-center gap-1">
                            <span
                                className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                                    done
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground",
                                    isCurrent && "ring-4 ring-primary/20"
                                )}
                            >
                                <meta.icon aria-hidden="true" className="size-4" />
                            </span>

                            {/* The rail between this step and the next. Painted as
                                a scaled child so the fill animates without the
                                track itself changing width. */}
                            {index < STEPS.length - 1 && (
                                <span
                                    aria-hidden="true"
                                    className="h-0.5 flex-1 overflow-hidden rounded-full bg-muted"
                                >
                                    <span
                                        className={cn(
                                            "block h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-(--ease-out-soft)",
                                            index < current ? "scale-x-100" : "scale-x-0"
                                        )}
                                    />
                                </span>
                            )}
                        </span>

                        <span
                            className={cn(
                                "text-xs leading-tight text-pretty",
                                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {meta.label}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}
