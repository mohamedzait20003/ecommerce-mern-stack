import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"

import { navUrls } from "@/lib/utils/navUrls"
import { useUser } from "@/lib/hooks/useUser"

type ProductLinkProps = Omit<ComponentProps<typeof Link>, "to"> & {
    to: string
}

export function ProductLink({ to, children, ...props }: Readonly<ProductLinkProps>) {
    const { isAuthenticated } = useUser()

    if (isAuthenticated) {
        return (
            <Link to={to} {...props}>
                {children}
            </Link>
        )
    }

    return (
        <Link
            to={`${navUrls.auth.login}?callbackUrl=${encodeURIComponent(to)}`}
            onClick={() => toast.info("Sign in to open a product and start a basket.")}
            {...props}
        >
            {children}
        </Link>
    )
}
