import { Link } from "react-router-dom"
import { CopyIcon, PackageIcon, RepeatIcon, TruckIcon } from "lucide-react"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/common/components/ui/accordion"
import { Card } from "@/common/components/ui/card"
import { CategoryIcon } from "@/common/components/catalog/category-icon"
import { cn } from "@/lib/utils/utils"
import { formatMoney } from "@/lib/models/catalogModels"
import { TONE_CLASS, toneFor } from "@/lib/utils/category-visual"

import { formatDate, type Order } from "./customer-data"
import { OrderTimeline, StatusBadge } from "./order-status"

/**
 * One order in the history.
 *
 * The header carries everything someone scanning the list needs — reference,
 * date, status, total, and a strip of the artwork — and the detail waits inside
 * an accordion. A list you can compare down the page beats five cards you have
 * to read in full, and the answer to "where is my parcel" is in the header of
 * the only order it applies to.
 */
export function OrderCard({
    order,
    basePath,
}: Readonly<{ order: Order; basePath: string }>) {
    const { reference, placedAt, status, total, items, expectedAt, trackingCode, seller } = order

    const unitCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const inFlight = status === "PACKED" || status === "SHIPPED" || status === "PLACED"

    return (
        <Card className="overflow-hidden border border-border py-0 shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <Accordion className="rounded-none border-0">
                <AccordionItem value={order.id} className="border-0">
                    <AccordionTrigger className="p-5 text-left hover:no-underline">
                        <span className="flex min-w-0 flex-1 flex-col gap-3">
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <StatusBadge status={status} />
                                <span className="font-heading text-base font-bold tabular-nums">
                                    {reference}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(placedAt)}
                                </span>
                            </span>

                            <span className="flex flex-wrap items-center justify-between gap-3">
                                {/* Overlapping thumbnails: the point is "which order
                                    is this", not a legible product list. */}
                                <span aria-hidden="true" className="flex -space-x-2">
                                    {items.slice(0, 4).map((item) => (
                                        <span
                                            key={item.variantId}
                                            className={cn(
                                                "flex size-10 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br ring-2 ring-card",
                                                TONE_CLASS[toneFor(item.categorySlug)]
                                            )}
                                        >
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt=""
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="size-full object-cover"
                                                />
                                            ) : (
                                                <CategoryIcon
                                                    slug={item.categorySlug}
                                                    className="size-4"
                                                />
                                            )}
                                        </span>
                                    ))}
                                </span>

                                <span className="flex items-baseline gap-3">
                                    <span className="text-sm text-muted-foreground">
                                        {unitCount} {unitCount === 1 ? "item" : "items"}
                                    </span>
                                    <span className="font-heading text-lg font-bold tabular-nums">
                                        {formatMoney(total)}
                                    </span>
                                </span>
                            </span>
                        </span>
                    </AccordionTrigger>

                    <AccordionContent className="px-5 pb-5">
                        <OrderTimeline status={status} className="mb-6" />

                        {inFlight && expectedAt && (
                            <p className="mb-5 flex items-center gap-2.5 rounded-xl bg-primary/8 px-3.5 py-3 text-sm">
                                <TruckIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                                <span>
                                    Expected by{" "}
                                    <span className="font-semibold">{formatDate(expectedAt)}</span>
                                    {trackingCode && (
                                        <>
                                            {" · "}
                                            <span className="text-muted-foreground">
                                                Tracking{" "}
                                                <span className="font-medium tabular-nums text-foreground">
                                                    {trackingCode}
                                                </span>
                                            </span>
                                        </>
                                    )}
                                </span>
                            </p>
                        )}

                        <h4 className="mb-3 text-sm font-semibold">
                            From {seller}
                        </h4>

                        <ul className="flex flex-col gap-3">
                            {items.map((item) => (
                                <li key={item.variantId} className="flex items-center gap-3">
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br",
                                            TONE_CLASS[toneFor(item.categorySlug)]
                                        )}
                                    >
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <CategoryIcon slug={item.categorySlug} className="size-5" />
                                        )}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <Link
                                            to={`${basePath}/shop?q=${item.slug}`}
                                            className="rounded-sm font-medium no-underline! outline-none hover:text-primary! focus-visible:ring-3 focus-visible:ring-ring/40"
                                        >
                                            {item.name}
                                        </Link>
                                        <span className="block text-sm text-muted-foreground tabular-nums">
                                            Qty {item.quantity} · {formatMoney(item.price)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                                to={`${basePath}/shop`}
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline! transition-colors outline-none hover:bg-primary/90 hover:text-primary-foreground! focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                <RepeatIcon aria-hidden="true" className="size-4" />
                                Buy these again
                            </Link>

                            {trackingCode ? (
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard?.writeText(trackingCode)}
                                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    <CopyIcon aria-hidden="true" className="size-4" />
                                    Copy tracking number
                                </button>
                            ) : (
                                <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm text-muted-foreground">
                                    <PackageIcon aria-hidden="true" className="size-4" />
                                    Tracking appears once it ships
                                </span>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    )
}
