import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Badge } from "@/common/components/ui/badge"
import { Card, CardContent } from "@/common/components/ui/card"
import { AddToCart } from "@/common/components/catalog/add-to-cart"
import { ProductLink } from "@/common/components/catalog/product-link"
import { Shine } from "@/common/components/animation/shine"
import { Tilt } from "@/common/components/animation/tilt"
import { formatMoney, hasDiscount, type DealItem } from "@/lib/models/catalogModels"
import { CategoryIcon } from "../catalog/category-icon"
import { TONE_CLASS, toneFor } from "@/lib/utils/category-visual"
import { DealMeter } from "./deal-meter"

/**
 * A headline offer.
 *
 * Deliberately one link, not two: the product name is stretched across the
 * whole card, and the "Grab deal" bar underneath is a decoration hidden from
 * assistive tech that reacts to the same hover. A card with both a body link
 * and a button link reads as two identical targets to a screen reader and as a
 * coin flip to everyone else.
 */
export function FlashDealCard({ deal, to }: Readonly<{ deal: DealItem; to: string }>) {
    const { product, savings, percentClaimed, unitsLeft } = deal
    const { name, price, listPrice, imageUrl, categorySlug, rating, reviewCount } = product

    const discount = Math.round(product.percentOff)

    return (
        <Tilt className="h-full" max={6}>
            <Card
                data-shine-host=""
                className="group/deal h-full gap-0 py-0 ring-foreground/8 transition-shadow duration-300 hover:shadow-xl dark:ring-foreground/12"
            >
                <div
                    className={cn(
                        "relative flex aspect-4/3 items-center justify-center overflow-hidden bg-linear-to-br",
                        TONE_CLASS[toneFor(categorySlug)]
                    )}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                        decoding="async"
                            className="size-full object-cover transition-transform duration-500 ease-(--ease-out-soft) group-hover/deal:scale-105 motion-reduce:transition-none motion-reduce:group-hover/deal:scale-100"
                        />
                    ) : (
                        <CategoryIcon
                            slug={categorySlug}
                            className="size-20 transition-transform duration-500 ease-(--ease-out-soft) group-hover/deal:scale-110 motion-reduce:transition-none motion-reduce:group-hover/deal:scale-100"
                        />
                    )}

                    <Badge className="absolute top-3 left-3 h-6 gap-1 bg-sale px-2.5 text-sm font-extrabold text-sale-foreground">
                        -{discount}%
                    </Badge>

                    <span className="absolute top-3 right-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur">
                        Save {formatMoney(savings)}
                    </span>

                    <Shine mode="hover" className="text-foreground/25" duration={1.6} />
                </div>

                <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    {rating === null ? (
                        <p className="text-xs text-muted-foreground">No reviews yet</p>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5 text-warning">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <StarIcon
                                        key={index}
                                        aria-hidden="true"
                                        className={cn(
                                            "size-3.5",
                                            index < Math.round(rating) ? "fill-current" : "opacity-25"
                                        )}
                                    />
                                ))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {rating.toFixed(1)}
                                <span className="sr-only"> out of 5</span> ({reviewCount})
                            </span>
                        </div>
                    )}

                    <h3 className="font-semibold text-pretty">
                        <ProductLink
                            to={to}
                            className="rounded-sm outline-none after:absolute after:inset-0 after:z-2 focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            {name}
                        </ProductLink>
                    </h3>

                    <p className="flex items-baseline gap-2">
                        <span className="font-heading text-2xl font-extrabold text-sale tabular-nums">
                            {formatMoney(price)}
                        </span>
                        {hasDiscount(product) && (
                            <s className="text-sm text-muted-foreground tabular-nums">
                                {formatMoney(listPrice)}
                            </s>
                        )}
                    </p>

                    {/* Unlimited offers have no allocation to be running out of, so
                        the scarcity meter is omitted rather than shown at zero. */}
                    {unitsLeft !== null && (
                        <DealMeter claimed={percentClaimed} left={unitsLeft} className="mt-auto pt-1" />
                    )}

                    <AddToCart
                        variantId={product.variantId}
                        name={name}
                        size="wide"
                        className="mt-auto"
                    />
                </CardContent>
            </Card>
        </Tilt>
    )
}
