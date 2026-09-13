import { MinusIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"

import { CategoryIcon } from "@/common/components/catalog/category-icon"
import { AnimatedNumber } from "@/common/components/animation/animated-number"
import { Pop } from "@/common/components/animation/pop"
import { cn } from "@/lib/utils/utils"
import { formatMoney } from "@/lib/models/catalogModels"
import { MAX_QUANTITY, priceDelta, type CartLineDto } from "@/lib/models/cartModels"
import { TONE_CLASS, toneFor } from "@/lib/utils/category-visual"

const STEPPER_BUTTON = cn(
    "relative flex size-10 cursor-pointer items-center justify-center rounded-lg",
    "text-muted-foreground transition-colors outline-none after:absolute after:-inset-1",
    "hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
    "disabled:pointer-events-none disabled:opacity-40"
)

/**
 * One line of the basket, straight from `CartResponse.Line`.
 *
 * The endpoint carries the variant's artwork, cropped square here exactly as
 * the product tile crops it, so one product does not change shape between the
 * grid and the basket. There is no category in the cart contract, so the
 * fallback tile takes its colour from a hash of the SKU — stable for a given
 * product, on the server and in the browser, without fetching the catalogue a
 * second time just to decorate a row.
 *
 * The quantity control is two buttons and a live figure rather than a number
 * input: on a phone a spinner opens a keyboard to turn a 1 into a 2, and the
 * two values anyone actually picks are one more and one less. The figure pops
 * when it changes and the line total travels to its new value, so the cause and
 * the effect read as one event.
 */
export function CartLineRow({
    line,
    onQuantity,
    onRemove,
    busy = false,
}: Readonly<{
    line: CartLineDto
    onQuantity: (variantId: string, quantity: number) => void
    onRemove: (variantId: string) => void
    busy?: boolean
}>) {
    const { variantId, sku, name, imageUrl, quantity, unitPrice, currentPrice, lineTotal, unavailable } = line

    const tone = toneFor(sku ?? variantId)
    const delta = priceDelta(line)

    return (
        <li
            className={cn(
                "flex gap-4 py-5 first:pt-0 last:pb-0",
                unavailable && "opacity-70"
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "flex aspect-square size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br sm:size-24",
                    TONE_CLASS[tone]
                )}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        // The name is the heading beside this; repeating it here
                        // would have a screen reader read the line twice.
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover"
                    />
                ) : (
                    <CategoryIcon slug="" className="size-8" />
                )}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="font-semibold text-pretty">{name}</h3>
                        {sku && (
                            <p className="mt-0.5 truncate text-sm text-muted-foreground tabular-nums">
                                {sku}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => onRemove(variantId)}
                        disabled={busy}
                        aria-label={`Remove ${name} from your basket`}
                        className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none after:absolute after:-inset-1 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40"
                    >
                        <Trash2Icon aria-hidden="true" className="size-4.5" />
                    </button>
                </div>

                {/* The two states the server can report about a line, in the order
                    they matter: gone beats merely repriced. */}
                {unavailable ? (
                    <p className="flex items-center gap-2 rounded-lg bg-destructive/8 px-2.5 py-1.5 text-xs font-semibold text-destructive">
                        <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
                        No longer sold — remove it to check out
                    </p>
                ) : (
                    delta !== 0 &&
                    currentPrice && (
                        <p className="flex items-center gap-2 rounded-lg bg-warning/8 px-2.5 py-1.5 text-xs font-semibold text-warning">
                            <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
                            Now {formatMoney(currentPrice)} — you are still charged the{" "}
                            {formatMoney(unitPrice)} you added it at
                        </p>
                    )
                )}

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-xl border border-border p-1">
                        <button
                            type="button"
                            onClick={() => onQuantity(variantId, quantity - 1)}
                            disabled={quantity <= 1 || busy}
                            aria-label={`Fewer ${name}`}
                            className={STEPPER_BUTTON}
                        >
                            <MinusIcon aria-hidden="true" className="size-4" />
                        </button>

                        {/* Announced on change, so the new quantity is spoken once
                            rather than each press landing silently. */}
                        <Pop
                            signal={quantity}
                            aria-live="polite"
                            className="min-w-8 text-center font-semibold tabular-nums"
                        >
                            {quantity}
                            <span className="sr-only"> in your basket</span>
                        </Pop>

                        <button
                            type="button"
                            onClick={() => onQuantity(variantId, quantity + 1)}
                            disabled={quantity >= MAX_QUANTITY || busy}
                            aria-label={`More ${name}`}
                            className={STEPPER_BUTTON}
                        >
                            <PlusIcon aria-hidden="true" className="size-4" />
                        </button>
                    </div>

                    <p className="text-right font-heading text-lg font-bold">
                        <AnimatedNumber
                            value={lineTotal.amount}
                            format={(value) =>
                                formatMoney({ amount: value, currency: lineTotal.currency })
                            }
                        />
                    </p>
                </div>
            </div>
        </li>
    )
}
