import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils/utils";
import { formatMoney } from "@/lib/models/catalogModels";
import { Reveal } from "@/common/components/animation/reveal";
import { Card, CardContent } from "@/common/components/ui/card";
import { TONE_CLASS, toneFor } from "@/lib/utils/category-visual";
import { CategoryIcon } from "@/common/components/catalog/category-icon";

import { formatDate, type Order } from "./customer-data"
import { OrderTimeline, StatusBadge } from "./order-status"

export function ActiveOrder({
    order,
    basePath,
}: Readonly<{ order: Order; basePath: string }>) {
    const { reference, status, total, items, expectedAt, placedAt } = order

    return (
        <Reveal>
            <Card className="overflow-hidden border border-border shadow-sm">
                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="flex flex-wrap items-center gap-3">
                                <StatusBadge status={status} />
                                <span className="font-heading text-lg font-bold tabular-nums">
                                    {reference}
                                </span>
                            </p>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                Placed {formatDate(placedAt)} · {formatMoney(total)}
                            </p>
                        </div>

                        <Link
                            to={`${basePath}/orders`}
                            className="group/act inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary transition-colors outline-none hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            All orders
                            <ArrowRightIcon
                                aria-hidden="true"
                                className="size-4 transition-transform duration-200 group-hover/act:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/act:translate-x-0"
                            />
                        </Link>
                    </div>

                    {expectedAt && (
                        <p className="rounded-xl bg-primary/8 px-3.5 py-3 text-sm">
                            Arriving by{" "}
                            <span className="font-semibold">{formatDate(expectedAt)}</span>
                        </p>
                    )}

                    <OrderTimeline status={status} />

                    <ul className="flex flex-wrap gap-3 border-t border-border pt-5">
                        {items.map((item) => (
                            <li key={item.variantId} className="flex items-center gap-2.5">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "flex size-10 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br",
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
                                        <CategoryIcon slug={item.categorySlug} className="size-4" />
                                    )}
                                </span>
                                <span className="text-sm">
                                    <span className="block font-medium">{item.name}</span>
                                    <span className="block text-muted-foreground tabular-nums">
                                        Qty {item.quantity}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </Reveal>
    )
}
