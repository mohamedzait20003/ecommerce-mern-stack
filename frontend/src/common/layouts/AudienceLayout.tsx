import type { FC } from "react"
import { Outlet, useParams } from "react-router-dom"

import { Navbar } from "@/common/components/main/navbar"
import { navFor } from "@/lib/utils/navLinks"
import { useCart } from "@/lib/hooks/useCart"
import { useUser } from "@/lib/hooks/useUser"

/**
 * The shell for pages that belong to no single audience.
 *
 * The company pages and the error pages are reached by visitors, customers and
 * admins at the same URL, so they carry no navigation of their own: the bar is
 * whichever one the viewer already had. Someone who lands on `/about` from
 * their customer shell keeps their cart and orders within reach, and an admin
 * keeps the console - nobody is dropped into a different site.
 *
 * The id comes from the route where there is one, and from the session
 * otherwise, which is the case on every page that uses this layout.
 */
const AudienceLayout: FC = () => {
    const { publicUserId } = useParams()
    const { user, role, isAuthenticated, logout, isLoggingOut } = useUser()
    const { totals } = useCart()

    const { MainLinks, Buttons, homeTo } = navFor(
        isAuthenticated ? role : null,
        publicUserId ?? user.publicUserId,
        { logout, isLoggingOut, cartCount: totals.itemCount },
    )

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar
                MainLinks={MainLinks}
                Buttons={Buttons}
                isAuthenticated={isAuthenticated}
                homeTo={homeTo}
            />
            <main id="main-content" className="flex-1">
                <Outlet />
            </main>
        </div>
    )
}

export default AudienceLayout
