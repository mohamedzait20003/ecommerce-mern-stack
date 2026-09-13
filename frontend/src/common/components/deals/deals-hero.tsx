import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ArrowRightIcon, TagIcon, ZapIcon } from "lucide-react"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/common/components/ui/breadcrumb"
import { ProductLink } from "@/common/components/catalog/product-link"
import { Aurora } from "@/common/components/animation/aurora"
import { CountUp } from "@/common/components/animation/count-up"
import { Countdown } from "@/common/components/animation/countdown"
import { Magnetic } from "@/common/components/animation/magnetic"
import { Parallax } from "@/common/components/animation/parallax"
import { Reveal } from "@/common/components/animation/reveal"
import { Shine } from "@/common/components/animation/shine"
import { formatMoney, type DealItem, type DealsSummary } from "@/lib/models/catalogModels"
import { CategoryIcon } from "../catalog/category-icon"

export function DealsHero({
    basePath,
    summary,
    preview,
}: Readonly<{
    basePath: string
    summary: DealsSummary
    /** The deepest cuts, already sorted by the server. */
    preview: DealItem[]
}>) {
    // The next offer to expire when there is one; midnight otherwise, so the
    // panel always counts down to a real moment rather than to nothing.
    const endsAt = useMemo(() => {
        if (summary.nextEndsAt) return new Date(summary.nextEndsAt)

        const midnight = new Date()
        midnight.setHours(24, 0, 0, 0)
        return midnight
    }, [summary.nextEndsAt])

    return (
        <section className="relative overflow-hidden border-b border-border">
            <Parallax speed={0.06} className="absolute inset-0 -z-1">
                <Aurora tone="sale" intensity={0.9} grid />
            </Parallax>

            <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-8 lg:pb-24">
                <Breadcrumb className="mb-8">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                render={<Link to={basePath || "/"} />}
                                className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                Home
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-medium">Deals</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                    <div>
                        <Reveal className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pr-4 pl-1.5 text-sm font-medium shadow-sm backdrop-blur">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sale/12 px-2.5 py-1 text-xs font-bold text-sale">
                                <span
                                    aria-hidden="true"
                                    data-pulse=""
                                    className="size-1.5 rounded-full bg-sale"
                                />
                                Live
                            </span>
                            <span className="text-muted-foreground">
                                Prices reset at midnight, every night
                            </span>
                        </Reveal>

                        <Reveal
                            delay={80}
                            as="h1"
                            className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
                        >
                            Deals worth{" "}
                            <span className="bg-[linear-gradient(100deg,var(--sale),var(--brand-3))] bg-clip-text text-transparent forced-colors:bg-none forced-colors:text-foreground">
                                setting an alarm
                            </span>{" "}
                            for.
                        </Reveal>

                        <Reveal
                            delay={160}
                            as="p"
                            className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground"
                        >
                            Every discount here is struck against the price the item actually sold
                            for yesterday, never an invented one. When the counter hits zero, so
                            does the offer.
                        </Reveal>

                        <Reveal delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Magnetic>
                                <a
                                    href="#flash-deals"
                                    data-shine-host=""
                                    className="relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    <ZapIcon aria-hidden="true" className="size-5" />
                                    Shop flash deals
                                    <Shine
                                        mode="hover"
                                        className="text-primary-foreground/40"
                                        duration={1.4}
                                    />
                                </a>
                            </Magnetic>

                            <a
                                href="#all-deals"
                                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 text-base font-semibold backdrop-blur transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                Browse every deal
                                <ArrowRightIcon aria-hidden="true" className="size-5" />
                            </a>
                        </Reveal>

                        <Reveal
                            delay={320}
                            as="dl"
                            className="mt-10 flex flex-wrap gap-x-10 gap-y-6"
                        >
                            {[
                                {
                                    value: <CountUp to={summary.dealCount} suffix=" live" />,
                                    label: "Deals on right now",
                                },
                                {
                                    value: (
                                        <CountUp
                                            to={Math.round(summary.deepestPercentOff)}
                                            suffix="%"
                                        />
                                    ),
                                    label: "Biggest discount today",
                                },
                                {
                                    value: (
                                        <CountUp to={Math.round(summary.totalSavings.amount)} prefix="$" />
                                    ),
                                    label: "Off full price, in total",
                                },
                            ].map(({ value, label }) => (
                                <div key={label}>
                                    <dt className="sr-only">{label}</dt>
                                    <dd>
                                        <span className="block font-heading text-3xl font-extrabold">
                                            {value}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="text-sm text-muted-foreground"
                                        >
                                            {label}
                                        </span>
                                    </dd>
                                </div>
                            ))}
                        </Reveal>
                    </div>

                    {/* Live summary rather than decoration: the timer people came for,
                        and the three offers most likely to make them stay. */}
                    <Reveal delay={200}>
                        <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
                            <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                <TagIcon aria-hidden="true" className="size-4 text-sale" />
                                Today&rsquo;s prices end in
                            </p>

                            <Countdown to={endsAt} className="mt-4" />

                            <p className="mt-7 mb-3 text-sm font-semibold">Deepest cuts right now</p>
                            <ul className="flex flex-col gap-1">
                                {preview.map((deal) => (
                                    <li key={deal.dealId}>
                                        <ProductLink
                                            to={`${basePath}/shop?q=${deal.product.slug}`}
                                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sale/12 text-sale"
                                            >
                                                <CategoryIcon
                                                    slug={deal.product.categorySlug}
                                                    className="size-5"
                                                />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">
                                                    {deal.product.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {formatMoney(deal.product.price)}{" "}
                                                    <s className="opacity-70">
                                                        {formatMoney(deal.product.listPrice)}
                                                    </s>
                                                </span>
                                            </span>
                                            <span className="shrink-0 rounded-full bg-sale/12 px-2 py-1 text-xs font-bold text-sale tabular-nums">
                                                -{Math.round(deal.product.percentOff)}%
                                            </span>
                                        </ProductLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    )
}
