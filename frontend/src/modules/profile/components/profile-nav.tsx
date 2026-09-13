import type { ComponentType, SVGProps } from "react"
import { NavLink } from "react-router-dom"

import { navUrls } from "@/lib/utils/navUrls"
import { cn } from "@/lib/utils/utils"

export interface ProfileSection {
    to: string
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    /** Only the customer shell has anywhere to ship or bill to. */
    customerOnly?: boolean
    end?: boolean
}

/**
 * The settings pages, in the order they matter.
 *
 * Identity first, then the two things people come here to change in a hurry —
 * a password and a privacy switch — then the commerce settings, which only a
 * customer has.
 */
export const SECTIONS = (
    icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>>
): ProfileSection[] => [
    { to: navUrls.profile.base, label: "Your details", icon: icons.user, end: true },
    { to: navUrls.profile.security, label: "Security", icon: icons.shield },
    { to: navUrls.profile.privacy, label: "Privacy", icon: icons.lock },
    { to: navUrls.profile.shipping, label: "Addresses", icon: icons.truck, customerOnly: true },
    { to: navUrls.profile.billing, label: "Payment", icon: icons.card, customerOnly: true },
]

const LINK = cn(
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium whitespace-nowrap",
    "text-muted-foreground transition-colors outline-none",
    "hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
    "aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold aria-[current=page]:text-primary"
)

/**
 * Moving between settings pages.
 *
 * A rail on desktop and a scrolling chip row on a phone — the same links, the
 * same order, in the shape each screen can actually hold. It stays a `<nav>`
 * with `aria-current` on the active entry either way, so where you are is
 * announced rather than only coloured in.
 */
export function ProfileNav({ sections }: Readonly<{ sections: ProfileSection[] }>) {
    return (
        <nav aria-label="Account settings">
            <ul
                className={cn(
                    "flex gap-1 overflow-x-auto pb-2",
                    "lg:flex-col lg:overflow-visible lg:pb-0"
                )}
            >
                {sections.map(({ to, label, icon: Icon, end }) => (
                    <li key={to} className="shrink-0 lg:shrink">
                        <NavLink to={to} end={end} className={LINK}>
                            <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

/**
 * The sections within the current page, as an on-this-page list.
 *
 * Each settings page is a stack of similar cards, and this is what turns that
 * stack into something you can jump around. The active entry comes from a
 * scroll spy rather than from the last click, so it stays right when the reader
 * scrolls past it under their own steam.
 */
export function SectionList({
    items,
    active,
}: Readonly<{ items: { id: string; label: string }[]; active: string }>) {
    return (
        <nav aria-label="On this page" className="hidden xl:block">
            <p className="mb-2 px-3 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                On this page
            </p>
            <ul className="flex flex-col gap-0.5">
                {items.map(({ id, label }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            aria-current={id === active ? "true" : undefined}
                            className={cn(
                                "flex min-h-11 items-center rounded-xl px-3 text-sm transition-colors outline-none",
                                "hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
                                id === active
                                    ? "bg-primary/10 font-semibold text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            {label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
