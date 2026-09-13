import { type FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ShoppingBagIcon, TriangleAlertIcon, UndoIcon, XIcon } from 'lucide-react';

import navUrls, { withUser } from '@/lib/utils/navUrls';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/common/components/ui/empty';
import { Card, CardContent } from '@/common/components/ui/card';
import { Skeleton } from '@/common/components/ui/skeleton';
import { Pop } from '@/common/components/animation/pop';
import { Reveal } from '@/common/components/animation/reveal';
import { Swap } from '@/common/components/animation/swap';
import { useCart } from '@/lib/hooks/useCart';
import { apiErrorMessage } from '@/lib/utils/apiError';

import { CartLineRow } from '../components/cart-line';
import { CartSummary } from '../components/cart-summary';

/** Reserves the list's height so the page does not jump when the cart lands. */
function CartSkeleton() {
    return (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem] lg:gap-10">
            <Card className="border border-border shadow-sm">
                <CardContent className="flex flex-col gap-5">
                    {Array.from({ length: 3 }, (_, index) => (
                        <div key={index} className="flex gap-4">
                            <Skeleton className="size-20 shrink-0 rounded-2xl sm:size-24" />
                            <div className="flex flex-1 flex-col gap-3">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="mt-auto h-11 w-32 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Skeleton className="h-96 rounded-3xl" />
        </div>
    );
}

const Cart: FC = () => {
    const { publicUserId } = useParams();
    const base = withUser(navUrls.customer.base, publicUserId);

    const {
        lines,
        totals,
        removed,
        isLoading,
        isMutating,
        error,
        hasPriceDrift,
        setQuantity,
        remove,
        undoRemove,
        dismissUndo,
    } = useCart();

    const blocked = lines.some((line) => line.unavailable);

    // Loading, then failed, then the cart itself: a basket that cannot be read
    // must say so rather than render as empty, which reads as "we lost it".
    const state = isLoading ? 'loading' : error ? 'error' : lines.length === 0 ? 'empty' : 'lines';

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <Reveal as="header" className="mb-8">
                <Link
                    to={`${base}/shop`}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                    <ArrowLeftIcon aria-hidden="true" className="size-4" />
                    Keep shopping
                </Link>

                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                    Your basket
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {isLoading ? (
                        'Loading your basket…'
                    ) : totals.itemCount === 0 ? (
                        'Nothing in here yet.'
                    ) : (
                        <>
                            <Pop signal={totals.itemCount} className="font-semibold text-foreground">
                                {totals.itemCount}
                            </Pop>{' '}
                            {totals.itemCount === 1 ? 'item' : 'items'}, held for you until you
                            check out.
                        </>
                    )}
                </p>
            </Reveal>

            {/* One undo slot for the whole page, so removing a second line replaces
                the offer rather than stacking two of them. */}
            {removed && (
                <Reveal
                    className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
                    role="status"
                >
                    <p className="text-sm">
                        <span className="font-semibold">{removed.name}</span> was removed from
                        your basket.
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={undoRemove}
                            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary transition-colors outline-none hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            <UndoIcon aria-hidden="true" className="size-4" />
                            Undo
                        </button>
                        <button
                            type="button"
                            onClick={dismissUndo}
                            aria-label="Dismiss"
                            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            <XIcon aria-hidden="true" className="size-4" />
                        </button>
                    </div>
                </Reveal>
            )}

            {/* Cart-wide warnings, above the lines that caused them. */}
            {state === 'lines' && (blocked || hasPriceDrift) && (
                <Reveal
                    role="status"
                    className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        blocked
                            ? 'border-destructive/30 bg-destructive/8 text-destructive'
                            : 'border-warning/30 bg-warning/8 text-warning'
                    }`}
                >
                    <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span className="text-pretty">
                        {blocked
                            ? 'One or more items are no longer sold. Remove them to check out.'
                            : 'A price has moved since you added it. You are still charged what the line says.'}
                    </span>
                </Reveal>
            )}

            <Swap swapKey={state}>
                {state === 'loading' && <CartSkeleton />}

                {state === 'error' && (
                    <Empty className="border border-dashed border-destructive/40">
                        <EmptyHeader>
                            <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-destructive/12 text-destructive">
                                <TriangleAlertIcon aria-hidden="true" className="size-6!" />
                            </EmptyMedia>
                            <EmptyTitle className="text-xl">We could not load your basket</EmptyTitle>
                            <EmptyDescription>
                                {apiErrorMessage(error, 'Something went wrong on our side.')}
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                Try again
                            </button>
                        </EmptyContent>
                    </Empty>
                )}

                {state === 'empty' && (
                    <Empty className="border border-dashed border-border">
                        <EmptyHeader>
                            <EmptyMedia variant="icon" className="size-14 rounded-2xl">
                                <ShoppingBagIcon aria-hidden="true" className="size-6!" />
                            </EmptyMedia>
                            <EmptyTitle className="text-xl">Your basket is empty</EmptyTitle>
                            <EmptyDescription>
                                Nothing has been added yet. The deals page is usually the fastest
                                way to fix that.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Link
                                to={`${base}/deals`}
                                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                See today&rsquo;s deals
                            </Link>
                            <Link
                                to={`${base}/shop`}
                                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border px-6 font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                            >
                                Browse the shop
                            </Link>
                        </EmptyContent>
                    </Empty>
                )}

                {state === 'lines' && (
                    <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem] lg:gap-10">
                        <Card className="border border-border shadow-sm">
                            <CardContent>
                                <h2 className="sr-only">Items in your basket</h2>
                                <ul className="divide-y divide-border">
                                    {lines.map((line) => (
                                        <CartLineRow
                                            key={line.variantId}
                                            line={line}
                                            busy={isMutating}
                                            onQuantity={setQuantity}
                                            onRemove={remove}
                                        />
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <CartSummary totals={totals} basePath={base} disabled={blocked} />
                    </div>
                )}
            </Swap>
        </div>
    );
};

export default Cart;
