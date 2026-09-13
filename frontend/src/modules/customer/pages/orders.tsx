import { type FC, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PackageOpenIcon } from 'lucide-react';

import navUrls, { withUser } from '@/lib/utils/navUrls';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/common/components/ui/empty';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/common/components/ui/tabs';
import { CountUp } from '@/common/components/animation/count-up';
import { Reveal, Stagger } from '@/common/components/animation/reveal';

import { ORDERS, type Order, type OrderStatus } from '../components/customer-data';
import { OrderCard } from '../components/order-card';

/** Matches the deals and careers filter chips, so the site filters one way. */
const TAB_CLASS =
    'h-11! flex-none! gap-2 rounded-full px-4 text-sm font-semibold ' +
    'shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-muted ' +
    'data-active:bg-primary! data-active:text-primary-foreground! data-active:shadow-none ' +
    'dark:data-active:bg-primary! dark:data-active:text-primary-foreground!';

type Filter = 'all' | 'active' | 'delivered' | 'returned';

const MATCHES: Record<Filter, (status: OrderStatus) => boolean> = {
    all: () => true,
    active: (status) => status === 'PLACED' || status === 'PACKED' || status === 'SHIPPED',
    delivered: (status) => status === 'DELIVERED',
    returned: (status) => status === 'CANCELLED' || status === 'RETURNED',
};

const LABELS: Record<Filter, string> = {
    all: 'All orders',
    active: 'On the way',
    delivered: 'Delivered',
    returned: 'Cancelled & returned',
};

const Orders: FC = () => {
    const { publicUserId } = useParams();
    const base = withUser(navUrls.customer.base, publicUserId);

    const [filter, setFilter] = useState<Filter>('all');

    // Counts come from the whole list, not the filtered one: a tab that reports
    // the size of its own result set always says the same number as the grid
    // beside it, which tells the reader nothing.
    const counts = useMemo(
        () =>
            (Object.keys(MATCHES) as Filter[]).reduce<Record<Filter, number>>(
                (all, key) => {
                    all[key] = ORDERS.filter((order) => MATCHES[key](order.status)).length;
                    return all;
                },
                { all: 0, active: 0, delivered: 0, returned: 0 }
            ),
        []
    );

    const lifetime = useMemo(
        () => ORDERS.reduce((sum, order) => sum + order.total.amount, 0),
        []
    );

    const visible: Order[] = ORDERS.filter((order) => MATCHES[filter](order.status));

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <Reveal as="header" className="mb-8">
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                    Your orders
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
                    <CountUp to={ORDERS.length} /> orders,{' '}
                    <CountUp
                        to={lifetime}
                        decimals={2}
                        prefix="$"
                        className="font-semibold text-foreground"
                    />{' '}
                    spent with independent sellers since you joined.
                </p>
            </Reveal>

            <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
                <TabsList className="h-auto! w-full flex-wrap justify-start gap-2 bg-transparent! p-0!">
                    {(Object.keys(LABELS) as Filter[]).map((key) => (
                        <TabsTrigger key={key} value={key} className={TAB_CLASS}>
                            {LABELS[key]}
                            <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-xs font-bold tabular-nums in-data-active:bg-primary-foreground/20">
                                {counts[key]}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {(Object.keys(LABELS) as Filter[]).map((key) => (
                    <TabsContent key={key} value={key} className="mt-8">
                        {visible.length === 0 ? (
                            <Empty className="border border-dashed border-border">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon" className="size-14 rounded-2xl">
                                        <PackageOpenIcon aria-hidden="true" className="size-6!" />
                                    </EmptyMedia>
                                    <EmptyTitle className="text-xl">
                                        Nothing here yet
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        No orders match {LABELS[key].toLowerCase()}. They will show
                                        up here the moment one does.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Link
                                        to={`${base}/shop`}
                                        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
                                    >
                                        Browse the shop
                                    </Link>
                                </EmptyContent>
                            </Empty>
                        ) : (
                            <Stagger as="ul" step={55} className="flex flex-col gap-4">
                                {visible.map((order) => (
                                    <li key={order.id}>
                                        <OrderCard order={order} basePath={base} />
                                    </li>
                                ))}
                            </Stagger>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            <Reveal as="p" delay={120} className="mt-10 text-sm text-pretty text-muted-foreground">
                Something wrong with an order?{' '}
                <Link
                    to={navUrls.common.support}
                    className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                    Support answers in under four minutes
                </Link>
                , at any hour.
            </Reveal>
        </div>
    );
};

export default Orders;
