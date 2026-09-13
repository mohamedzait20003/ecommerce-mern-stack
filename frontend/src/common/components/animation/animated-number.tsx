import { useEffect, useRef, type ComponentProps } from "react"

import { cn } from "@/lib/utils/utils"

type AnimatedNumberProps = Omit<ComponentProps<"span">, "children"> & {
    value: number
    /** Wraps the number, e.g. a currency formatter. Must be stable across renders. */
    format?: (value: number) => string
    /** Milliseconds for the tween between two values. */
    duration?: number
}

/**
 * A number that travels to its new value instead of jumping to it.
 *
 * The counterpart to `CountUp`, which runs once when it is first scrolled to.
 * This one animates on every change, which is what a cart total needs: the
 * point is to show that the number moved *because* the quantity did, and by
 * how much. A total that silently swaps digits leaves the shopper checking the
 * arithmetic themselves.
 *
 * The first render paints the real value — no tween from zero on mount, which
 * would make an already-correct total look like it was still loading. Frames
 * are written straight to the DOM node, so a 60fps tween costs no re-renders.
 */
export function AnimatedNumber({
    value,
    format = (next) => next.toLocaleString(),
    duration = 420,
    className,
    ...props
}: Readonly<AnimatedNumberProps>) {
    const ref = useRef<HTMLSpanElement>(null)
    const shown = useRef(value)
    // Kept in a ref so changing the formatter identity cannot restart a tween.
    // Synced in its own effect, declared first so it has already run by the time
    // the tween below reads it on the same commit.
    const formatter = useRef(format)
    useEffect(() => {
        formatter.current = format
    })

    useEffect(() => {
        const node = ref.current
        const from = shown.current
        if (!node || from === value) return

        shown.current = value

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            node.textContent = formatter.current(value)
            return
        }

        const started = performance.now()
        let frame = 0

        const tick = (now: number) => {
            const progress = Math.min(1, (now - started) / duration)
            // Ease-out cubic: quick off the mark, settles gently on the value.
            const eased = 1 - Math.pow(1 - progress, 3)
            node.textContent = formatter.current(from + (value - from) * eased)
            if (progress < 1) frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(frame)
            // Unmounting mid-tween must still leave the true value behind.
            node.textContent = formatter.current(value)
        }
    }, [value, duration])

    return (
        <span ref={ref} className={cn("tabular-nums", className)} {...props}>
            {format(value)}
        </span>
    )
}
