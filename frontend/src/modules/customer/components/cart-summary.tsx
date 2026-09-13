import { Link } from "react-router-dom"
import { LockIcon, RotateCcwIcon, TruckIcon } from "lucide-react"

import { Card, CardContent } from "@/common/components/ui/card"
import { Progress } from "@/common/components/ui/progress"
import { Separator } from "@/common/components/ui/separator"
import { AnimatedNumber } from "@/common/components/animation/animated-number"
import { Magnetic } from "@/common/components/animation/magnetic"
import { Shine } from "@/common/components/animation/shine"
import { formatMoney } from "@/lib/models/catalogModels"

import type { CartTotals } from "@/lib/hooks/useCart"

/**
 * What the basket costs, and what happens next.
 *
 * Every figure is shown before checkout, including the shipping — the whole
 * promise on the storefront is that the number at the top of the page is the
 * number charged at the bottom, and a summary that reveals postage one screen
 * later breaks it.
 *
 * The totals travel rather than jump when a quantity changes, which is what
 * makes the connection between the stepper and this panel obvious without
 * anyone having to re-read the arithmetic.
 */
export function CartSummary({
    totals,
    basePath,
    disabled = false,
}: Readonly<{ totals: CartTotals; basePath: string; disabled?: boolean }>) {
    const { subtotal, shipping, total, toFreeShipping, freeShippingPercent, itemCount } = totals

    const currency = total.currency
    const asMoney = (value: number) => formatMoney({ amount: value, currency })
    const shipsFree = shipping.amount === 0 && itemCount > 0

    return (
        <Card className="border border-border shadow-sm lg:sticky lg:top-24">
            <CardContent className="flex flex-col gap-5">
                <h2 className="font-heading text-lg font-bold">Order summary</h2>

                {/* Progress toward free shipping. Worth its own block because it is
                    the one number a shopper can still act on from this page. */}
                <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium">
                        <TruckIcon
                            aria-hidden="true"
                            className={shipsFree ? "size-4 text-success" : "size-4 text-muted-foreground"}
                        />
                        {shipsFree ? (
                            <span className="text-success">Your order ships free</span>
                        ) : (
                            <span>
                                <AnimatedNumber value={toFreeShipping.amount} format={asMoney} /> away
                                from free shipping
                            </span>
                        )}
                    </p>
                    <Progress
                        value={freeShippingPercent}
                        aria-label="Progress toward free shipping"
                        className="gap-0 [&_[data-slot=progress-indicator]]:bg-linear-to-r [&_[data-slot=progress-indicator]]:from-brand-2 [&_[data-slot=progress-indicator]]:to-brand-3 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-foreground/10"
                    />
                </div>

                <dl className="flex flex-col gap-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">
                            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                        </dt>
                        <dd className="font-medium">
                            <AnimatedNumber value={subtotal.amount} format={asMoney} />
                        </dd>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Shipping</dt>
                        <dd className="font-medium">
                            {shipsFree ? (
                                <span className="text-success">Free</span>
                            ) : (
                                <AnimatedNumber value={shipping.amount} format={asMoney} />
                            )}
                        </dd>
                    </div>

                    <Separator className="my-1" />

                    <div className="flex items-baseline justify-between gap-3">
                        <dt className="font-heading text-base font-bold">Total</dt>
                        <dd className="font-heading text-2xl font-extrabold">
                            <AnimatedNumber value={total.amount} format={asMoney} />
                        </dd>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Tax is included in every price shown.
                    </p>
                </dl>

                <Magnetic className="w-full" strength={0.2} limit={6}>
                    {/* No checkout route yet: this points at the orders page so the
                        button leads somewhere real instead of nowhere. Swap the
                        target when checkout ships. */}
                    <Link
                        to={`${basePath}/orders`}
                        data-shine-host=""
                        aria-disabled={itemCount === 0 || disabled}
                        className="relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 aria-disabled:pointer-events-none aria-disabled:opacity-60"
                    >
                        <LockIcon aria-hidden="true" className="size-4.5" />
                        Checkout securely
                        <Shine mode="hover" className="text-primary-foreground/40" duration={1.4} />
                    </Link>
                </Magnetic>

                <p className="flex items-start gap-2 text-xs text-pretty text-muted-foreground">
                    <RotateCcwIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                    Thirty days to change your mind, return postage on us — sale items included.
                </p>
            </CardContent>
        </Card>
    )
}
