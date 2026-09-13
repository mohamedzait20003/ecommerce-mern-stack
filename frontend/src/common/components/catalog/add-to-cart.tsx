import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";

import { cn } from "@/lib/utils/utils";
import { useCart } from "@/lib/hooks/useCart";
import { useUser } from "@/lib/hooks/useUser";
import { navUrls } from "@/lib/utils/navUrls";
import { MAX_QUANTITY } from "@/lib/models/cartModels";
import { Pop } from "@/common/components/animation/pop";
import { Spinner } from "@/common/components/ui/spinner";

type AddToCartProps = {
    variantId: string
    name: string
    size?: "icon" | "wide"
    className?: string
}

/** Round control on a tile, square-ish bar on a deal card. */
const CONTROL = {
    icon: "size-9 rounded-full",
    wide: "h-11 w-full rounded-xl gap-2 px-4",
}

const STEP = cn(
    "relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full",
    "text-primary transition-colors outline-none after:absolute after:-inset-1",
    "hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/40",
    "disabled:pointer-events-none disabled:opacity-40"
)


export function AddToCart({ variantId, name, size = "icon", className }: Readonly<AddToCartProps>) {
    const { isAuthenticated } = useUser()
    const { lines, add, setQuantity, remove } = useCart()
    const [pending, setPending] = useState(false)

    const line = lines.find((item) => item.variantId === variantId)
    const wide = size === "wide"

    const run = async (action: () => Promise<unknown>) => {
        setPending(true)
        try {
            await action()
        } finally {
            setPending(false)
        }
    }
    
    if (!isAuthenticated) {
        return (
            <Link
                to={`${navUrls.auth.login}?callbackUrl=${encodeURIComponent(navUrls.landing.shop)}`}
                onClick={() => toast.info("Sign in to start a basket.")}
                aria-label={`Sign in to add ${name} to a basket`}
                className={cn(
                    "relative z-3 inline-flex items-center justify-center bg-primary/10 font-semibold text-primary",
                    "transition-colors outline-none hover:bg-primary hover:text-primary-foreground",
                    "focus-visible:ring-3 focus-visible:ring-ring/40",
                    CONTROL[size],
                    className
                )}
            >
                <ShoppingCartIcon aria-hidden="true" className="size-4" />
                {wide && "Sign in to buy"}
            </Link>
        )
    }

    if (line) {
        const only = line.quantity <= 1

        return (
            <div
                className={cn(
                    "relative z-3 flex items-center justify-between rounded-full bg-primary/10 p-0.5",
                    wide && "h-11 w-full rounded-xl px-1",
                    className
                )}
            >
                <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                        run(() =>
                            only ? remove(variantId) : setQuantity(variantId, line.quantity - 1)
                        )
                    }
                    aria-label={
                        only ? `Remove ${name} from your basket` : `One fewer ${name}`
                    }
                    className={STEP}
                >
                    {only ? (
                        <Trash2Icon aria-hidden="true" className="size-4" />
                    ) : (
                        <MinusIcon aria-hidden="true" className="size-4" />
                    )}
                </button>

                {pending ? (
                    <Spinner aria-label={`Updating ${name}`} className="size-4 text-primary" />
                ) : (
                    <Pop
                        signal={line.quantity}
                        aria-live="polite"
                        className="min-w-6 text-center text-sm font-bold text-primary tabular-nums"
                    >
                        {line.quantity}
                        <span className="sr-only"> {name} in your basket</span>
                    </Pop>
                )}

                <button
                    type="button"
                    disabled={pending || line.quantity >= MAX_QUANTITY}
                    onClick={() => run(() => setQuantity(variantId, line.quantity + 1))}
                    aria-label={`One more ${name}`}
                    className={STEP}
                >
                    <PlusIcon aria-hidden="true" className="size-4" />
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            disabled={pending}
            onClick={() => run(() => add(variantId))}
            aria-label={`Add ${name} to your basket`}
            className={cn(
                "relative z-3 inline-flex cursor-pointer items-center justify-center bg-primary/10 font-semibold text-primary",
                "transition-colors outline-none hover:bg-primary hover:text-primary-foreground",
                "focus-visible:ring-3 focus-visible:ring-ring/40",
                "disabled:pointer-events-none disabled:opacity-60",
                CONTROL[size],
                className
            )}
        >
            {pending ? (
                <Spinner aria-hidden="true" className="size-4" />
            ) : (
                <ShoppingCartIcon aria-hidden="true" className="size-4" />
            )}
            {wide && (pending ? "Adding…" : "Add to basket")}
        </button>
    )
}
