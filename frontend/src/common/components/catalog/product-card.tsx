import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Badge } from "@/common/components/ui/badge"
import { Card, CardContent } from "@/common/components/ui/card"
import { formatMoney, hasDiscount, type ProductCardDto } from "@/lib/models/catalogModels"
import { AddToCart } from "./add-to-cart"
import { CategoryIcon } from "./category-icon"
import { ProductLink } from "./product-link"
import { TONE_CLASS, toneFor } from "@/lib/utils/category-visual"

function Stars({ rating }: Readonly<{ rating: number }>) {
    return (
        <span className="flex items-center gap-0.5 text-warning">
            {[0, 1, 2, 3, 4].map((index) => (
                <StarIcon
                    key={index}
                    aria-hidden="true"
                    className={cn("size-3.5", index < Math.round(rating) ? "fill-current" : "opacity-25")}
                />
            ))}
        </span>
    )
}

/**
 * One product tile, rendered straight from the catalogue response.
 *
 * Takes the API shape rather than a local one so there is no adapter in the
 * middle to disagree with the server about a price. `listPrice` equals `price`
 * when nothing is on offer, which is why the "was" is a comparison rather than
 * a null check, and `rating` is null for an unreviewed product - shown as
 * "No reviews yet" rather than as zero stars, which reads as a bad score.
 */
export function ProductCard({ product, to }: Readonly<{ product: ProductCardDto; to: string }>) {
    const { name, price, listPrice, imageUrl, categorySlug, rating, reviewCount, percentOff } = product

    const discounted = hasDiscount(product)
    const discount = Math.round(percentOff)
    const tone = toneFor(categorySlug)

    return (
        <Card className="group/product relative h-full gap-0 py-0 transition-shadow duration-300 hover:shadow-xl">
            <div
                className={cn(
                    "relative flex aspect-square items-center justify-center overflow-hidden bg-linear-to-br",
                    TONE_CLASS[tone]
                )}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        // The name is already the heading below; repeating it here
                        // would have a screen reader read the product twice.
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 ease-(--ease-out-soft) group-hover/product:scale-105 motion-reduce:transition-none motion-reduce:group-hover/product:scale-100"
                    />
                ) : (
                    <CategoryIcon
                        slug={categorySlug}
                        className="size-16 transition-transform duration-500 ease-(--ease-out-soft) group-hover/product:scale-110 motion-reduce:transition-none motion-reduce:group-hover/product:scale-100"
                    />
                )}
                {discount > 0 && (
                    <Badge className="absolute top-3 left-3 bg-sale text-sale-foreground">
                        -{discount}%
                    </Badge>
                )}
            </div>

            <CardContent className="flex flex-1 flex-col gap-2 p-4">
                {rating === null ? (
                    <p className="text-xs text-muted-foreground">No reviews yet</p>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <Stars rating={rating} />
                        {/* The number carries the rating for anyone who cannot see the stars. */}
                        <span className="text-xs text-muted-foreground">
                            {rating.toFixed(1)}
                            <span className="sr-only"> out of 5</span> ({reviewCount})
                        </span>
                    </div>
                )}

                <h3 className="font-semibold text-pretty">
                    {/* Stretched link: the whole card is the target, but only one
                        link exists — and it is the gated one, so a visitor is sent
                        to sign in rather than into a page that would bounce them. */}
                    <ProductLink
                        to={to}
                        className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        {name}
                    </ProductLink>
                </h3>

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="flex items-baseline gap-1.5">
                        <span
                            className={cn(
                                "text-lg font-bold tabular-nums",
                                discounted ? "text-sale" : "text-foreground"
                            )}
                        >
                            {formatMoney(price)}
                        </span>
                        {discounted && (
                            <s className="text-sm text-muted-foreground tabular-nums">
                                {formatMoney(listPrice)}
                            </s>
                        )}
                    </p>
                    {/* A real control, not decoration: it sits above the
                        stretched link so a click lands here rather than opening
                        the product. */}
                    <AddToCart variantId={product.variantId} name={name} />
                </div>
            </CardContent>
        </Card>
    )
}
