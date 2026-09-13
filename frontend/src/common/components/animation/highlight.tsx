import type { ComponentProps, ElementType } from "react"

import { cn } from "@/lib/utils/utils"

type HighlightProps = ComponentProps<"section"> & {
    /** The anchor. Following `#id` is what triggers the flash. */
    id: string
    as?: ElementType
}

/**
 * Flashes a ring around itself when it is the anchor that was jumped to.
 *
 * Clicking an entry in a section list scrolls somewhere, and on a page of
 * similar-looking cards "somewhere" is not obviously "there" — so the browser's
 * own `:target` does the work: no click handler, no state, and it stays correct
 * when the URL is pasted in fresh or the back button restores it.
 *
 * The animation is a `box-shadow` ring that fades out; nothing moves, so a
 * flash cannot shift the thing it is trying to point at.
 */
export function Highlight({
    id,
    as: Tag = "section",
    className,
    children,
    ...props
}: Readonly<HighlightProps>) {
    return (
        <Tag
            id={id}
            data-highlight=""
            className={cn("scroll-mt-24 rounded-3xl", className)}
            {...props}
        >
            {children}
        </Tag>
    )
}
