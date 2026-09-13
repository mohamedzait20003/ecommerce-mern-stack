import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils/utils"

const TONE: Record<string, string> = {
    primary: "text-primary",
    success: "text-success",
    info: "text-info",
    warning: "text-warning",
    sale: "text-sale",
}

type ProgressRingProps = Omit<ComponentProps<"div">, "children"> & {
    /** 0-100. Clamped, because a server that says 104% should not draw 104%. */
    value: number
    size?: number
    thickness?: number
    tone?: keyof typeof TONE
    /** What the ring measures, for anyone who cannot see it. */
    label: string
    /** Sits in the middle of the ring — usually the figure the ring is drawing. */
    children?: ReactNode
}

/**
 * A circular meter.
 *
 * For the one figure on a screen that is a fraction of something: how far an
 * order has travelled, how much of a basket is left before free shipping. A bar
 * would say the same thing, but a ring can hold the number in the middle of it,
 * which halves the eye travel.
 *
 * The sweep is `stroke-dashoffset` on a fixed-length path, so it animates
 * between values without touching layout. `role="progressbar"` and the aria
 * values carry the meaning; the drawing is decoration on top of that.
 */
export function ProgressRing({
    value,
    size = 96,
    thickness = 8,
    tone = "primary",
    label,
    children,
    className,
    ...props
}: Readonly<ProgressRingProps>) {
    const safe = Math.max(0, Math.min(100, value))
    const radius = (size - thickness) / 2
    const length = 2 * Math.PI * radius

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(safe)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className={cn("relative inline-flex items-center justify-center", className)}
            style={{ width: size, height: size }}
            {...props}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
                <circle
                    data-ring-track=""
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={thickness}
                    className="stroke-foreground/10"
                />
                <circle
                    data-ring-value=""
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    className={cn("stroke-current", TONE[tone])}
                    style={{
                        "--ring-length": length,
                        "--ring-offset": length - (length * safe) / 100,
                    }}
                />
            </svg>

            {children && (
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                    {children}
                </span>
            )}
        </div>
    )
}
