import { type ComponentType, type FC, type SVGProps } from "react"
import { Link, NavLink } from "react-router-dom"
import { Menu } from "@base-ui/react/menu"
import { MenuIcon, XIcon } from "lucide-react"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "../ui/tooltip"

import Logo from "./logo"
import { cn } from "@/lib/utils/utils"
import { ThemeToggle } from "../ui/theme-toggle"


type NavIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface MainLinkProps {
    to: string
    label: string
    icon: NavIcon
    end?: boolean
}

export interface ButtonsProps {
    label: string
    icon: NavIcon
    to?: string
    onClick?: () => void
    variant?: "primary" | "ghost"
    disabled?: boolean
    badge?: number
    /**
     * Show the glyph alone. For a shell whose actions are the same four every
     * time — a customer's — the words are read once and never again, and four
     * of them crowd out the navigation they sit beside.
     */
    iconOnly?: boolean
}

const linkClasses = cn(
    "relative inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap",
    "text-muted-foreground transition-colors outline-none",
    "hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
    "aria-[current=page]:font-semibold aria-[current=page]:text-primary",
    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0",
    "aria-[current=page]:after:opacity-100",
    "motion-safe:after:transition-opacity motion-safe:after:duration-200"
)

function actionClasses(variant: ButtonsProps["variant"], iconOnly?: boolean) {
    return cn(
        "relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold whitespace-nowrap",
        iconOnly ? "w-11" : "px-4",
        "transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )
}

function ActionBadge({ count, corner }: Readonly<{ count: number; corner?: boolean }>) {
    return (
        <span
            className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sale px-1.5 text-xs font-bold tabular-nums text-sale-foreground",
                corner ? "absolute -top-1 -right-1" : "ml-0.5"
            )}
        >
            {count > 99 ? "99+" : count}
        </span>
    )
}

const NavAction: FC<ButtonsProps & { className?: string }> = ({
    label,
    icon: Icon,
    to,
    onClick,
    variant = "ghost",
    disabled,
    badge,
    className,
    iconOnly,
}) => {
    // `aria-label` carries the name once the word is gone, so the control is
    // still announced properly; the tooltip is the sighted equivalent.
    const content = (
        <>
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {!iconOnly && <span>{label}</span>}
            {badge !== undefined && badge > 0 && (
                <ActionBadge count={badge} corner={iconOnly} />
            )}
        </>
    )
    const classes = cn(actionClasses(variant, iconOnly), className)

    const control = to ? (
        <Link to={to} aria-label={label} className={classes}>
            {content}
        </Link>
    ) : (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={classes}
        >
            {content}
        </button>
    )

    if (!iconOnly) {
        return control
    }

    return (
        <Tooltip>
            <TooltipTrigger render={control} />
            <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
    )
}

const MobileMenu: FC<{ MainLinks: MainLinkProps[]; Buttons: ButtonsProps[] }> = ({
    MainLinks,
    Buttons,
}) => (
    <Menu.Root>
        <Menu.Trigger
            aria-label="Open menu"
            className="group inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-popup-open:bg-muted data-popup-open:text-foreground lg:hidden"
        >
            <MenuIcon className="size-5 group-data-popup-open:hidden" />
            <XIcon className="hidden size-5 group-data-popup-open:block" />
        </Menu.Trigger>

        <Menu.Portal>
            <Menu.Positioner sideOffset={8} align="end" className="z-50">
                <Menu.Popup
                    className={cn(
                        "w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none",
                        "origin-(--transform-origin) transition-[opacity,transform] duration-200 ease-out",
                        "data-starting-style:scale-95 data-starting-style:opacity-0",
                        "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
                        "motion-reduce:transition-none"
                    )}
                >
                    {Buttons.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 p-1">
                            {Buttons.map((button) => (
                                <Menu.Item
                                    key={button.label}
                                    disabled={button.disabled}
                                    render={
                                        button.to ? (
                                            <Link to={button.to} />
                                        ) : (
                                            <button type="button" onClick={button.onClick} />
                                        )
                                    }
                                    className={cn(
                                        actionClasses(button.variant ?? "ghost"),
                                        "flex-1",
                                        button.variant === "primary"
                                            ? "data-highlighted:bg-primary/90"
                                            : "data-highlighted:bg-muted data-highlighted:text-foreground"
                                    )}
                                >
                                    <button.icon className="size-5 shrink-0" aria-hidden="true" />
                                    <span>{button.label}</span>
                                    {button.badge !== undefined && button.badge > 0 && (
                                        <ActionBadge count={button.badge} />
                                    )}
                                </Menu.Item>
                            ))}
                        </div>
                    )}

                    {Buttons.length > 0 && MainLinks.length > 0 && (
                        <Menu.Separator className="my-2 h-px bg-border" />
                    )}
                    {MainLinks.map((link) => (
                        <Menu.Item
                            key={link.to}
                            render={<NavLink to={link.to} end={link.end} />}
                            className={cn(
                                "flex h-12 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm font-medium",
                                "text-muted-foreground outline-none select-none",
                                "data-highlighted:bg-muted data-highlighted:text-foreground",
                                "aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold aria-[current=page]:text-primary"
                            )}
                        >
                            <link.icon className="size-5 shrink-0" aria-hidden="true" />
                            <span>{link.label}</span>
                        </Menu.Item>
                    ))}
                </Menu.Popup>
            </Menu.Positioner>
        </Menu.Portal>
    </Menu.Root>
)

export const Navbar: FC<{
    MainLinks?: MainLinkProps[]
    Buttons?: ButtonsProps[]
    isAuthenticated?: boolean
    homeTo?: string
}> = ({ MainLinks = [], Buttons = [], isAuthenticated, homeTo }) => {
    const hasMenu = MainLinks.length > 0 || Buttons.length > 0

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
            >
                Skip to content
            </a>
            <nav
                aria-label="Main"
                className={cn(
                    "flex h-16 w-full items-center gap-3 pl-4 sm:pl-6 lg:pl-8",
                    "lg:grid lg:grid-cols-[1fr_auto_1fr]"
                )}
            >
                <div className="flex min-w-0 justify-start">
                    <Logo isAuthenticated={isAuthenticated} to={homeTo} />
                </div>

                <ul className="hidden items-center gap-1 lg:flex">
                    {MainLinks.map((link) => (
                        <li key={link.to}>
                            <NavLink to={link.to} end={link.end} className={linkClasses}>
                                <link.icon className="size-5 shrink-0" aria-hidden="true" />
                                <span>{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="ml-auto flex items-center gap-1 lg:ml-0 lg:justify-end lg:gap-2">
                    <ThemeToggle />

                    <div className="hidden items-center gap-2 lg:flex">
                        {Buttons.map((button) => (
                            <NavAction key={button.label} {...button} />
                        ))}
                    </div>

                    {hasMenu && <MobileMenu MainLinks={MainLinks} Buttons={Buttons} />}
                </div>
            </nav>
        </header>
    )
}
