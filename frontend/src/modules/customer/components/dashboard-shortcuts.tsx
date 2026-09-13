import type { ComponentType, SVGProps } from "react"
import { Link } from "react-router-dom"
import { ArrowRightIcon, PackageIcon, ShoppingCartIcon, TagIcon, UserIcon } from "lucide-react"

import { Card, CardContent } from "@/common/components/ui/card"
import { Stagger } from "@/common/components/animation/reveal"
import { Tilt } from "@/common/components/animation/tilt"
import { cn } from "@/lib/utils/utils"

type Shortcut = {
    to: string
    label: string
    hint: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    tone: string
}

/**
 * The four places a signed-in shopper goes.
 *
 * The same destinations as the bar above, given room to say what is behind
 * them: a nav item can only afford a word, and "Orders" does not tell you that
 * one of them is out for delivery. Each tile tilts toward the pointer, so the
 * grid answers the cursor before it is clicked.
 */
export function DashboardShortcuts({
    basePath,
    profileTo,
    basketCount,
    activeOrders,
    dealCount,
}: Readonly<{
    basePath: string
    profileTo: string
    basketCount: number
    activeOrders: number
    dealCount: number
}>) {
    const shortcuts: Shortcut[] = [
        {
            to: `${basePath}/cart`,
            label: "Your basket",
            hint:
                basketCount === 0
                    ? "Nothing saved yet"
                    : `${basketCount} ${basketCount === 1 ? "item" : "items"} ready to check out`,
            icon: ShoppingCartIcon,
            tone: "bg-chart-1/12 text-chart-1",
        },
        {
            to: `${basePath}/orders`,
            label: "Your orders",
            hint:
                activeOrders === 0
                    ? "Nothing in transit"
                    : `${activeOrders} on the way right now`,
            icon: PackageIcon,
            tone: "bg-chart-2/12 text-chart-2",
        },
        {
            to: `${basePath}/deals`,
            label: "Today's deals",
            hint: dealCount === 0 ? "Refreshed every morning" : `${dealCount} live until midnight`,
            icon: TagIcon,
            tone: "bg-chart-4/12 text-chart-4",
        },
        {
            to: profileTo,
            label: "Your profile",
            hint: "Addresses, cards and privacy",
            icon: UserIcon,
            tone: "bg-chart-5/12 text-chart-5",
        },
    ]

    return (
        <Stagger as="ul" step={55} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map(({ to, label, hint, icon: Icon, tone }) => (
                <li key={label}>
                    <Tilt max={5} className="h-full">
                        <Card className="group/shortcut h-full border border-border transition-shadow duration-300 hover:shadow-lg">
                            <CardContent className="flex h-full flex-col gap-3">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "flex size-11 items-center justify-center rounded-2xl",
                                        tone
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>

                                <h3 className="font-heading text-base font-bold">
                                    {/* Stretched: the whole tile is the target, and
                                        there is exactly one link inside it. */}
                                    <Link
                                        to={to}
                                        className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/40"
                                    >
                                        {label}
                                    </Link>
                                </h3>

                                <p className="text-sm text-pretty text-muted-foreground">{hint}</p>

                                <span
                                    aria-hidden="true"
                                    className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary"
                                >
                                    Open
                                    <ArrowRightIcon className="size-4 transition-transform duration-200 group-hover/shortcut:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/shortcut:translate-x-0" />
                                </span>
                            </CardContent>
                        </Card>
                    </Tilt>
                </li>
            ))}
        </Stagger>
    )
}
