import { useState } from "react"
import { toast } from "react-toastify"
import {
    BuildingIcon,
    CheckIcon,
    CreditCardIcon,
    HomeIcon,
    PlusIcon,
    ReceiptTextIcon,
    Trash2Icon,
} from "lucide-react"

import { Badge } from "@/common/components/ui/badge"
import { cn } from "@/lib/utils/utils"

import { SettingsCard } from "./settings-card"

/**
 * Addresses and cards, as local fixtures.
 *
 * There is no address or payment endpoint — `userHandlers` covers auth and the
 * profile picture, nothing more. These seed the screens with the shape the API
 * will return so the layout, the default-address logic and the empty states are
 * real work now. A card is only ever brand plus last four; the number itself
 * never reaches this application.
 */
interface Address {
    id: string
    label: string
    kind: "home" | "work"
    lines: string[]
    isDefault: boolean
}

interface PaymentCard {
    id: string
    brand: string
    last4: string
    expiry: string
    isDefault: boolean
}

const ADDRESSES: Address[] = [
    {
        id: "addr-home",
        label: "Home",
        kind: "home",
        lines: ["14 Ashwood Terrace", "Flat 3", "Bristol BS1 4QD", "United Kingdom"],
        isDefault: true,
    },
    {
        id: "addr-work",
        label: "Work",
        kind: "work",
        lines: ["Kestrel House", "22 Redcliff Street", "Bristol BS1 6NL", "United Kingdom"],
        isDefault: false,
    },
]

const CARDS: PaymentCard[] = [
    { id: "card-visa", brand: "Visa", last4: "4029", expiry: "08 / 28", isDefault: true },
    { id: "card-mc", brand: "Mastercard", last4: "7731", expiry: "02 / 27", isDefault: false },
]

function DefaultBadge() {
    return (
        <Badge className="h-6 gap-1.5 bg-success/12 px-2.5 font-semibold text-success">
            <CheckIcon aria-hidden="true" />
            Default
        </Badge>
    )
}

export function AddressesSection() {
    const [defaultId, setDefaultId] = useState(
        ADDRESSES.find((address) => address.isDefault)?.id ?? ""
    )

    return (
        <SettingsCard
            id="addresses"
            icon={HomeIcon}
            title="Delivery addresses"
            description="Where parcels go. The default is filled in at checkout, and you can change it there."
            action={
                <button
                    type="button"
                    onClick={() => toast.info("Adding an address is not wired up yet.")}
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                    <PlusIcon aria-hidden="true" className="size-4" />
                    Add
                </button>
            }
        >
            <ul className="grid gap-4 sm:grid-cols-2">
                {ADDRESSES.map((address) => {
                    const isDefault = address.id === defaultId

                    return (
                        <li
                            key={address.id}
                            className={cn(
                                "flex flex-col gap-3 rounded-2xl border p-4 transition-colors",
                                isDefault ? "border-primary/40 bg-primary/5" : "border-border"
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="flex items-center gap-2 font-semibold">
                                    {address.kind === "work" ? (
                                        <BuildingIcon
                                            aria-hidden="true"
                                            className="size-4 text-muted-foreground"
                                        />
                                    ) : (
                                        <HomeIcon
                                            aria-hidden="true"
                                            className="size-4 text-muted-foreground"
                                        />
                                    )}
                                    {address.label}
                                </span>
                                {isDefault && <DefaultBadge />}
                            </div>

                            <address className="text-sm leading-relaxed text-muted-foreground not-italic">
                                {address.lines.map((line) => (
                                    <span key={line} className="block">
                                        {line}
                                    </span>
                                ))}
                            </address>

                            <div className="mt-auto flex flex-wrap gap-1 pt-1">
                                {!isDefault && (
                                    <button
                                        type="button"
                                        onClick={() => setDefaultId(address.id)}
                                        className="inline-flex h-10 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold text-primary transition-colors outline-none hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                                    >
                                        Make default
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => toast.info("Editing an address is not wired up yet.")}
                                    className="inline-flex h-10 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toast.info("Removing an address is not wired up yet.")}
                                    aria-label={`Remove the ${address.label} address`}
                                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    <Trash2Icon aria-hidden="true" className="size-4" />
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </SettingsCard>
    )
}

export function DeliveryPreferencesSection() {
    return (
        <SettingsCard
            id="delivery"
            icon={ReceiptTextIcon}
            title="How we deliver"
            description="The same for every order, and always shown again before you pay."
        >
            <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Standard delivery
                    </dt>
                    <dd className="mt-1">Free over $50, otherwise $4.95</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Returns
                    </dt>
                    <dd className="mt-1">30 days, postage paid by us</dd>
                </div>
            </dl>
        </SettingsCard>
    )
}

export function PaymentMethodsSection() {
    const [defaultId, setDefaultId] = useState(CARDS.find((card) => card.isDefault)?.id ?? "")

    return (
        <SettingsCard
            id="cards"
            icon={CreditCardIcon}
            title="Payment methods"
            description="Stored by our payment processor, never by us. We only ever see the last four digits."
            action={
                <button
                    type="button"
                    onClick={() => toast.info("Adding a card is not wired up yet.")}
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                    <PlusIcon aria-hidden="true" className="size-4" />
                    Add
                </button>
            }
        >
            <ul className="flex flex-col gap-3">
                {CARDS.map((card) => {
                    const isDefault = card.id === defaultId

                    return (
                        <li
                            key={card.id}
                            className={cn(
                                "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition-colors",
                                isDefault ? "border-primary/40 bg-primary/5" : "border-border"
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <span
                                    aria-hidden="true"
                                    className="flex h-9 w-13 items-center justify-center rounded-lg bg-linear-to-br from-brand-2/20 to-brand-3/20 text-brand-3"
                                >
                                    <CreditCardIcon className="size-5" />
                                </span>
                                <span>
                                    <span className="block font-medium">
                                        {card.brand} ending {card.last4}
                                    </span>
                                    <span className="block text-sm text-muted-foreground tabular-nums">
                                        Expires {card.expiry}
                                    </span>
                                </span>
                            </span>

                            <span className="flex items-center gap-1">
                                {isDefault ? (
                                    <DefaultBadge />
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setDefaultId(card.id)}
                                        className="inline-flex h-10 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold text-primary transition-colors outline-none hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/40"
                                    >
                                        Make default
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => toast.info("Removing a card is not wired up yet.")}
                                    aria-label={`Remove the ${card.brand} ending ${card.last4}`}
                                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40"
                                >
                                    <Trash2Icon aria-hidden="true" className="size-4" />
                                </button>
                            </span>
                        </li>
                    )
                })}
            </ul>
        </SettingsCard>
    )
}

export function InvoicesSection() {
    return (
        <SettingsCard
            id="invoices"
            icon={ReceiptTextIcon}
            title="Receipts"
            description="Every order emails one the moment it is paid for."
        >
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-pretty text-muted-foreground">
                Downloadable receipts arrive with the billing endpoint. In the meantime, each
                order confirmation email is a full receipt.
            </p>
        </SettingsCard>
    )
}
