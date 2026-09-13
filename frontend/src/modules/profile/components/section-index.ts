/**
 * The anchors on each settings page, in document order.
 *
 * Kept apart from the section components so those files export only components
 * and keep fast refresh — the same split as `order-status-data.ts` and
 * `category-visual.ts`. It is also the one place that decides what the
 * on-this-page list says, so a renamed card cannot leave a stale entry behind.
 */

export interface SectionAnchor {
    id: string
    label: string
}

export const IDENTITY_SECTIONS: SectionAnchor[] = [
    { id: "picture", label: "Photo" },
    { id: "personal", label: "Personal" },
    { id: "account", label: "Account" },
    { id: "preferences", label: "Preferences" },
]

export const SECURITY_SECTIONS: SectionAnchor[] = [
    { id: "change-password", label: "Password" },
    { id: "two-factor", label: "Two-factor" },
    { id: "active-sessions", label: "Devices" },
]

export const PRIVACY_SECTIONS: SectionAnchor[] = [
    { id: "data-management", label: "Your data" },
    { id: "account-rights", label: "Tracking" },
    { id: "notification-settings", label: "Notifications" },
]

export const SHIPPING_SECTIONS: SectionAnchor[] = [
    { id: "addresses", label: "Addresses" },
    { id: "delivery", label: "Delivery" },
]

export const BILLING_SECTIONS: SectionAnchor[] = [
    { id: "cards", label: "Payment methods" },
    { id: "invoices", label: "Receipts" },
]
