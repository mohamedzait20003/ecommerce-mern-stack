import { useEffect, useRef, type ComponentProps, type ElementType } from "react"

import { cn } from "@/lib/utils/utils"

type PopProps = ComponentProps<"span"> & {
    /**
     * Changing this pops the contents. Use the value itself — a cart count, a
     * quantity — so the pop is the value's own reaction, not a separate trigger
     * somebody has to remember to fire.
     */
    signal: number | string
    as?: ElementType
}

/**
 * Gives a value a beat when it changes.
 *
 * The badge on a cart button is easy to miss: it is small, it sits in the
 * corner of the screen, and the thing that changed it was somewhere else
 * entirely. A single scale pulse connects the two without moving anything —
 * scale is composited, so nothing around it reflows.
 *
 * Nothing fires on mount: a page arriving with three items in the basket is not
 * an event, and animating it would cry wolf.
 */
export function Pop({ className, signal, as: Tag = "span", children, ...props }: Readonly<PopProps>) {
    const ref = useRef<HTMLSpanElement>(null)
    const previous = useRef(signal)

    useEffect(() => {
        const node = ref.current
        if (!node || signal === previous.current) return
        previous.current = signal

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

        const clear = () => delete node.dataset.pop
        node.addEventListener("animationend", clear, { once: true })

        // Reflow between removing and re-adding, or an identical attribute
        // value never restarts the animation.
        clear()
        void node.offsetWidth
        node.dataset.pop = ""

        return () => node.removeEventListener("animationend", clear)
    }, [signal])

    return (
        <Tag ref={ref} className={cn("inline-block", className)} {...props}>
            {children}
        </Tag>
    )
}
