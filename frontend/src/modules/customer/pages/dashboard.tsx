import { type FC, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FlameIcon, PackageIcon, PiggyBankIcon, TagIcon } from 'lucide-react';

import navUrls, { withUser } from '@/lib/utils/navUrls';
import { Card, CardContent } from '@/common/components/ui/card';
import { Skeleton } from '@/common/components/ui/skeleton';
import { ProductCard } from '@/common/components/catalog/product-card';
import { Section, SectionHeading } from '@/common/components/main/section';
import { CountUp } from '@/common/components/animation/count-up';
import { Reveal, Stagger } from '@/common/components/animation/reveal';
import { useDeals, useLanding } from '@/lib/hooks/useCatalog';
import { useCart } from '@/lib/hooks/useCart';
import { useUser } from '@/lib/hooks/useUser';
import { cn } from '@/lib/utils/utils';

import { ActiveOrder } from '../components/active-order';
import { DashboardHero } from '../components/dashboard-hero';
import { DashboardShortcuts } from '../components/dashboard-shortcuts';
import { ORDERS } from '../components/customer-data';

const STAT_TONE = [
    'bg-chart-2/12 text-chart-2',
    'bg-chart-5/12 text-chart-5',
    'bg-chart-4/12 text-chart-4',
    'bg-chart-1/12 text-chart-1',
];

const Dashboard: FC = () => {
    const { publicUserId } = useParams();
    const base = withUser(navUrls.customer.base, publicUserId);

    const { user } = useUser();
    const { totals } = useCart();
    const { trending, isLoading: landingLoading } = useLanding();
    const { summary, flash } = useDeals();

    const activeOrders = useMemo(
        () =>
            ORDERS.filter(
                (order) =>
                    order.status === 'PLACED' ||
                    order.status === 'PACKED' ||
                    order.status === 'SHIPPED'
            ),
        []
    );

    const lifetimeSaved = useMemo(
        () => ORDERS.reduce((sum, order) => sum + order.total.amount, 0) * 0.18,
        []
    );

    const name = user.firstName || user.displayName || user.username || 'there';

    const stats = [
        { value: ORDERS.length, label: 'Orders placed', icon: PackageIcon },
        {
            value: lifetimeSaved,
            decimals: 0,
            prefix: '$',
            label: 'Saved on offers',
            icon: PiggyBankIcon,
        },
        { value: summary.dealCount, label: 'Deals live now', icon: TagIcon },
        {
            value: summary.deepestPercentOff,
            suffix: '%',
            label: 'Biggest cut today',
            icon: FlameIcon,
        },
    ];

    return (
        <>
            <DashboardHero name={name} basePath={base} itemCount={totals.itemCount} />

            <Section className="py-10 sm:py-12 lg:py-14">
                <Stagger
                    as="dl"
                    step={60}
                    className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                >
                    {stats.map(({ value, label, icon: Icon, decimals, prefix, suffix }, index) => (
                        <Card key={label} className="border border-border">
                            <CardContent className="flex items-center gap-4">
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                                        STAT_TONE[index]
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                {/* Term before definition in the DOM as the spec
                                    requires; reversed visually so the figure leads. */}
                                <div className="flex min-w-0 flex-col-reverse">
                                    <dt className="truncate text-sm text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="font-heading text-2xl font-extrabold">
                                        <CountUp
                                            to={value}
                                            decimals={decimals}
                                            prefix={prefix}
                                            suffix={suffix}
                                        />
                                    </dd>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </Stagger>
            </Section>

            {activeOrders.length > 0 && (
                <Section className="pt-0 pb-10 sm:pb-12 lg:pb-14">
                    <SectionHeading
                        className="mb-6 sm:mb-8"
                        eyebrow="On its way"
                        title="Your latest order"
                        description="The one that is actually moving. Everything else lives in your order history."
                        action={{ to: `${base}/orders`, label: 'See all orders' }}
                        align="start"
                    />
                    <ActiveOrder order={activeOrders[0]} basePath={base} />
                </Section>
            )}

            <Section className="pt-0 pb-10 sm:pb-12 lg:pb-14">
                <SectionHeading
                    className="mb-6 sm:mb-8"
                    title="Jump back in"
                    description="The four places you spend your time here."
                    align="start"
                />
                <DashboardShortcuts
                    basePath={base}
                    profileTo={navUrls.profile.base}
                    basketCount={totals.itemCount}
                    activeOrders={activeOrders.length}
                    dealCount={summary.dealCount}
                />
            </Section>

            {(landingLoading || trending.length > 0) && (
                <Section className="bg-muted/40">
                    <SectionHeading
                        eyebrow="Picked for you"
                        title="Trending with other shoppers"
                        description="What people are adding to their baskets today."
                        action={{ to: `${base}/shop`, label: 'Browse everything' }}
                        align="start"
                    />

                    {landingLoading ? (
                        // Reserves the grid's height so the page does not jump when
                        // the catalogue arrives.
                        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }, (_, index) => (
                                <li key={index}>
                                    <Skeleton className="aspect-4/5 w-full rounded-3xl" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Stagger
                            as="ul"
                            step={50}
                            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            {trending.slice(0, 8).map((product) => (
                                <li key={product.variantId}>
                                    <ProductCard
                                        product={product}
                                        to={`${base}/shop?q=${product.slug}`}
                                    />
                                </li>
                            ))}
                        </Stagger>
                    )}
                </Section>
            )}

            {flash.length > 0 && (
                <Section className="pt-0">
                    <SectionHeading
                        eyebrow="Ends tonight"
                        title="Deals worth a look"
                        description="Struck against what these sold for yesterday, and gone at midnight."
                        action={{ to: `${base}/deals`, label: 'See every deal' }}
                        align="start"
                    />

                    <Stagger
                        as="ul"
                        step={50}
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {flash.slice(0, 4).map((deal) => (
                            <li key={deal.product.variantId}>
                                <ProductCard
                                    product={deal.product}
                                    to={`${base}/shop?q=${deal.product.slug}`}
                                />
                            </li>
                        ))}
                    </Stagger>

                    <Reveal
                        as="p"
                        delay={120}
                        className="mt-8 text-sm text-pretty text-muted-foreground"
                    >
                        Prices reset at midnight, every night.{' '}
                        <Link
                            to={`${base}/deals`}
                            className="rounded-sm font-semibold text-primary underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            See what is live right now
                        </Link>
                        .
                    </Reveal>
                </Section>
            )}
        </>
    );
};

export default Dashboard;
