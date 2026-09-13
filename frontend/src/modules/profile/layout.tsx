import type { FC } from "react"
import { Outlet } from "react-router-dom"
import {
    CreditCardIcon,
    LockIcon,
    ShieldCheckIcon,
    TruckIcon,
    UserIcon,
} from "lucide-react"

import { Navbar } from "@/common/components/main/navbar"
import { navFor } from "@/lib/utils/navLinks"
import { useCart } from "@/lib/hooks/useCart"
import { useUser } from "@/lib/hooks/useUser"

import { ProfileHeader } from "./components/profile-header"
import { ProfileNav, SECTIONS } from "./components/profile-nav"

const ICONS = {
    user: UserIcon,
    shield: ShieldCheckIcon,
    lock: LockIcon,
    truck: TruckIcon,
    card: CreditCardIcon,
}

const Layout: FC = () => {
    const { user, role, isAuthenticated, logout, isLoggingOut } = useUser()
    const { totals } = useCart()

    const { MainLinks, Buttons, homeTo } = navFor(
        isAuthenticated ? role : null,
        user.publicUserId,
        { logout, isLoggingOut, cartCount: totals.itemCount }
    )

    const sections = SECTIONS(ICONS).filter(
        (section) => !section.customerOnly || role === "CUSTOMER"
    )

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar
                MainLinks={MainLinks}
                Buttons={Buttons}
                isAuthenticated={isAuthenticated}
                homeTo={homeTo}
            />

            <ProfileHeader />

            <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <ProfileNav sections={sections} />
                    </aside>

                    <main id="main-content">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}

export default Layout
