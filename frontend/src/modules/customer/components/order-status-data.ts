/**
 * What each order status means, as data.
 *
 * Kept apart from `order-status.tsx` so that file exports only components: a
 * module that mixes the two loses fast refresh, and the same split already
 * exists between `category-visual.ts` and `category-icon.tsx`.
 */
import type { ComponentType, SVGProps } from "react"
import {
    CheckCircle2Icon,
    ClipboardCheckIcon,
    PackageIcon,
    RotateCcwIcon,
    TruckIcon,
    XCircleIcon,
} from "lucide-react"

import type { OrderStatus } from "./customer-data"

type StatusMeta = {
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    /** Written out in full: Tailwind scans this file as text. */
    badge: string
    /** Position in the happy path, or -1 for an ending that leaves it. */
    step: number
}

/**
 * The four steps an order walks, plus the two ways it can stop.
 *
 * Cancelled and returned are given `-1` rather than a step number because they
 * are not further along the path — a returned order has been everywhere a
 * delivered one has and then come back, and drawing it as "step 5" would say
 * the opposite.
 */
export const STATUS: Record<OrderStatus, StatusMeta> = {
    PLACED: {
        label: "Order placed",
        icon: ClipboardCheckIcon,
        badge: "bg-info/12 text-info",
        step: 0,
    },
    PACKED: {
        label: "Being packed",
        icon: PackageIcon,
        badge: "bg-warning/12 text-warning",
        step: 1,
    },
    SHIPPED: {
        label: "On its way",
        icon: TruckIcon,
        badge: "bg-primary/12 text-primary",
        step: 2,
    },
    DELIVERED: {
        label: "Delivered",
        icon: CheckCircle2Icon,
        badge: "bg-success/12 text-success",
        step: 3,
    },
    CANCELLED: {
        label: "Cancelled",
        icon: XCircleIcon,
        badge: "bg-destructive/12 text-destructive",
        step: -1,
    },
    RETURNED: {
        label: "Returned",
        icon: RotateCcwIcon,
        badge: "bg-muted text-muted-foreground",
        step: -1,
    },
}

/** The happy path, in order. */
export const STEPS: OrderStatus[] = ["PLACED", "PACKED", "SHIPPED", "DELIVERED"]
