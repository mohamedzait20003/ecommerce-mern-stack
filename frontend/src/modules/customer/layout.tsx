import type { FC } from "react"
import { Outlet, useParams } from "react-router-dom"

import { useCart } from "@/lib/hooks/useCart";
import { useUser } from "@/lib/hooks/useUser";
import { customerNav } from "@/lib/utils/navLinks";
import { Navbar } from "@/common/components/main/navbar";

const Layout: FC = () => {
    const { publicUserId } = useParams()
    const { logout, isLoggingOut } = useUser()
    const { totals } = useCart()

    const { MainLinks, Buttons, homeTo } = customerNav(publicUserId, {
        logout,
        isLoggingOut,
        cartCount: totals.itemCount,
    })

    return (
        <div className="flex min-h-dvh flex-col">
            <Navbar
                MainLinks={MainLinks}
                Buttons={Buttons}
                isAuthenticated
                homeTo={homeTo}
            />
            <main id="main-content" className="flex-1">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
