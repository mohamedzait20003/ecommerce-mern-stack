import { Link } from "react-router-dom"
import { ArrowRightIcon, SearchIcon, SparklesIcon } from "lucide-react"

import { Aurora } from "@/common/components/animation/aurora"
import { Magnetic } from "@/common/components/animation/magnetic"
import { Parallax } from "@/common/components/animation/parallax"
import { Reveal } from "@/common/components/animation/reveal"
import { Shine } from "@/common/components/animation/shine"

/**
 * Time-of-day greeting.
 *
 * Computed at render on the client. On the server it lands on whatever the
 * server's clock says — which is why it is never the only thing in the heading:
 * the name below it carries the sentence either way.
 */
function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
}

/**
 * The top of a signed-in shopper's home.
 *
 * Opens with their name and a way back into what they were doing, rather than
 * with a marketing headline. Someone who is already signed in has been sold to;
 * the shipping threshold is the basket's business, and the basket says it.
 */
export function DashboardHero({
    name,
    basePath,
    itemCount,
}: Readonly<{
    name: string
    basePath: string
    itemCount: number
}>) {
    return (
        <section className="relative isolate overflow-hidden border-b border-border">
            <Parallax speed={0.06} className="absolute inset-0 -z-1">
                <Aurora tone="brand" intensity={0.8} grid />
            </Parallax>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <Reveal
                    as="p"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pr-4 pl-1.5 text-sm font-medium shadow-sm backdrop-blur"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary">
                        <SparklesIcon aria-hidden="true" className="size-3.5" />
                        {greeting()}
                    </span>
                    <span className="text-muted-foreground">Everything is where you left it</span>
                </Reveal>

                <Reveal
                    delay={80}
                    as="h1"
                    className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl"
                >
                    Welcome back,{" "}
                    <span className="bg-[linear-gradient(100deg,var(--brand-2),var(--brand-3))] bg-clip-text text-transparent forced-colors:bg-none forced-colors:text-foreground">
                        {name}
                    </span>
                    .
                </Reveal>

                <Reveal
                    delay={160}
                    as="p"
                    className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground"
                >
                    {itemCount > 0
                        ? `You have ${itemCount} ${itemCount === 1 ? "item" : "items"} waiting in your basket, and an order on its way.`
                        : "Nothing in your basket right now — today's deals are the quickest way to change that."}
                </Reveal>

                <Reveal delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Magnetic>
                        <Link
                            to={`${basePath}/shop`}
                            data-shine-host=""
                            className="relative inline-flex h-13 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-7 font-semibold text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            <SearchIcon aria-hidden="true" className="size-5" />
                            Browse the shop
                            <Shine mode="hover" className="text-primary-foreground/40" duration={1.4} />
                        </Link>
                    </Magnetic>

                    <Link
                        to={`${basePath}/cart`}
                        className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 font-semibold backdrop-blur transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        {itemCount > 0 ? "Back to your basket" : "View your basket"}
                        <ArrowRightIcon aria-hidden="true" className="size-5" />
                    </Link>
                </Reveal>
            </div>
        </section>
    )
}
