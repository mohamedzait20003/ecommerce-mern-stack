import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils/utils"

type CollapseProps = Omit<ComponentProps<"div">, "children"> & {
    open: boolean
    children: ReactNode
}

/**
 * Reveals a panel by growing to whatever height its contents need.
 *
 * `height: auto` cannot be animated, and measuring the content to animate to a
 * pixel value means reading layout on every open — so this animates
 * `grid-template-rows` from `0fr` to `1fr` instead, which interpolates and
 * needs no measurement (see `index.css`). The panel is always in the DOM, so a
 * form inside it keeps its state across an open/close and a screen reader is
 * not handed a collapsed region full of focusable controls: `inert` takes them
 * out of the tab order while it is shut.
 *
 * Under reduced motion the CSS drops the transition and the panel simply
 * appears at full height.
 */
export function Collapse({ open, className, children, ...props }: Readonly<CollapseProps>) {
    return (
        <div
            data-collapse=""
            data-open={open ? "" : undefined}
            inert={!open}
            aria-hidden={!open}
            className={cn(className)}
            {...props}
        >
            <div>{children}</div>
        </div>
    )
}
