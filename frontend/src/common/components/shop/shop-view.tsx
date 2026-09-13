import { Link } from "react-router-dom"
import { ChevronRightIcon } from "lucide-react"

import { Reveal } from "@/common/components/animation/reveal"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/common/components/ui/pagination"
import { useShop } from "@/lib/hooks/useCatalog"
import { toShopQuery, useShopFilters } from "@/lib/utils/use-shop-filters"

import { ActiveFilters } from "./active-filters"
import { ShopFiltersPanel } from "./shop-filters"
import { ShopResults } from "./shop-results"
import { ShopToolbar } from "./shop-toolbar"

/**
 * The shop grid, shared by the visitor route and the signed-in one.
 *
 * Filtering, sorting and paging all happen on the server: the URL says what the
 * shopper asked for, `useShop` asks for exactly that, and the page renders what
 * comes back. Nothing here re-derives a result set, so the grid, the count and
 * the pager cannot disagree with each other about the catalogue.
 *
 * `basePath` is the prefix every product link needs, so the same component can
 * point at `/shop` for a visitor and `/user/abc/shop` for a customer without
 * either page knowing about the other's routing.
 */
export function ShopView({
    basePath = "",
    title = "Shop everything",
    description = "Products from verified independent sellers. Filter it down, or just have a look around.",
}: Readonly<{ basePath?: string; title?: string; description?: string }>) {
    const { filters, apply, reset, activeCount } = useShopFilters()

    // RTK Query keeps the previous page on screen while the next one loads, so
    // `isFetching` is the "these results are one filter behind" signal.
    const { products, page, categories, isFetching } = useShop(toShopQuery(filters))

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <li>
                        <Link
                            to={basePath || "/"}
                            className="rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                        >
                            Home
                        </Link>
                    </li>
                    <li aria-hidden="true">
                        <ChevronRightIcon className="size-4" />
                    </li>
                    <li aria-current="page" className="font-medium text-foreground">
                        Shop
                    </li>
                </ol>
            </nav>

            <Reveal as="header" className="mb-8">
                <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                    {title}
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{description}</p>
            </Reveal>

            <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
                {/* Sticky on desktop so filters stay reachable deep into a long grid. */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24">
                        <h2 className="sr-only">Filters</h2>
                        <ShopFiltersPanel filters={filters} categories={categories} apply={apply} />
                    </div>
                </aside>

                <div className="flex flex-col gap-6">
                    <ShopToolbar
                        filters={filters}
                        categories={categories}
                        apply={apply}
                        total={page.totalItems}
                        activeCount={activeCount}
                    />

                    <ActiveFilters
                        filters={filters}
                        categories={categories}
                        apply={apply}
                        reset={reset}
                    />

                    <ShopResults
                        products={products}
                        basePath={basePath}
                        stale={isFetching}
                        onReset={reset}
                    />

                    {page.totalPages > 1 && (
                        <Pagination className="pt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        aria-disabled={page.page === 1}
                                        className={
                                            page.page === 1
                                                ? "pointer-events-none opacity-50"
                                                : "cursor-pointer"
                                        }
                                        onClick={() => apply({ page: page.page - 1 })}
                                    />
                                </PaginationItem>

                                {Array.from({ length: page.totalPages }, (_, index) => index + 1).map(
                                    (number) => (
                                        <PaginationItem key={number}>
                                            <PaginationLink
                                                isActive={number === page.page}
                                                aria-label={`Page ${number}`}
                                                className="cursor-pointer"
                                                onClick={() => apply({ page: number })}
                                            >
                                                {number}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                )}

                                <PaginationItem>
                                    <PaginationNext
                                        aria-disabled={!page.hasNext}
                                        className={
                                            page.hasNext
                                                ? "cursor-pointer"
                                                : "pointer-events-none opacity-50"
                                        }
                                        onClick={() => apply({ page: page.page + 1 })}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            </div>
        </div>
    )
}
