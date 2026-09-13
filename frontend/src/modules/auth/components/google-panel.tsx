import { useSyncExternalStore } from "react"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"

import { useTheme } from "@/lib/hooks/useTheme";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Separator } from "@/common/components/ui/separator";


const NEVER_CHANGES = () => () => {};

type GooglePanelProps = {
    onSuccess: (credential: CredentialResponse) => void
    onError: () => void
    dividerLabel: string
    disabled?: boolean
};


export function GooglePanel({
    onSuccess,
    onError,
    dividerLabel,
    disabled,
}: Readonly<GooglePanelProps>) {
    const { theme } = useTheme()

    const hydrated = useSyncExternalStore(
        NEVER_CHANGES,
        () => true,
        () => false
    )

    const dark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)

    return (
        <div className="flex flex-col gap-6">
            <div
                className="flex min-h-11 justify-center [&>div]:w-full [&_iframe]:mx-auto!"
                aria-disabled={disabled}
                style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}
            >
                {hydrated ? (
                    <GoogleLogin
                        onSuccess={onSuccess}
                        onError={onError}
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="rectangular"
                        theme={dark ? "filled_black" : "outline"}
                    />
                ) : (
                    <Skeleton className="h-11 w-full rounded-lg" />
                )}
            </div>
            <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {dividerLabel}
                </span>
                <Separator className="flex-1" />
            </div>
        </div>
    )
}
