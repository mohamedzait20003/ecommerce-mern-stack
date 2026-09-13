import { BadgeCheckIcon, ShieldAlertIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar"
import { Badge } from "@/common/components/ui/badge"
import { Aurora } from "@/common/components/animation/aurora"
import { Parallax } from "@/common/components/animation/parallax"
import { Reveal } from "@/common/components/animation/reveal"
import { useUser } from "@/lib/hooks/useUser"

/** First letters of the two names, or of the username when there are none. */
function initials(first: string, last: string, username: string): string {
    const pair = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim()
    return (pair || username.slice(0, 2)).toUpperCase()
}

/**
 * Who you are signed in as, at the top of the settings.
 *
 * Every screen underneath is a list of controls, and a page of controls with no
 * subject at the top is a page you have to remember the context of. This says
 * whose account is being edited before anything asks to be edited — including
 * the one thing worth acting on immediately, an unverified email.
 */
export function ProfileHeader() {
    const { user, role, isVerified } = useUser()

    const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.displayName ||
        user.username

    return (
        <section className="relative isolate overflow-hidden border-b border-border">
            <Parallax speed={0.05} className="absolute inset-0 -z-1">
                <Aurora tone="brand" intensity={0.75} grid />
            </Parallax>

            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
                <Reveal>
                    <Avatar className="size-20 shadow-sm ring-4 ring-card sm:size-24">
                        {user.profilePicURL && (
                            <AvatarImage src={user.profilePicURL} alt="" />
                        )}
                        <AvatarFallback className="bg-linear-to-br from-brand-2/20 to-brand-3/20 font-heading text-2xl font-extrabold">
                            {initials(user.firstName, user.lastName, user.username)}
                        </AvatarFallback>
                    </Avatar>
                </Reveal>

                <Reveal delay={80} className="min-w-0 flex-1">
                    <h1 className="font-heading text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                        {name || "Your account"}
                    </h1>

                    <p className="mt-1 truncate text-muted-foreground">{user.email}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {role && (
                            <Badge className="h-6 bg-secondary px-2.5 font-semibold text-secondary-foreground">
                                {role}
                            </Badge>
                        )}

                        {/* Icon and word, not just colour: "verified" and "not
                            verified" must survive a monochrome screen. */}
                        {isVerified ? (
                            <Badge className="h-6 gap-1.5 bg-success/12 px-2.5 font-semibold text-success">
                                <BadgeCheckIcon aria-hidden="true" />
                                Email verified
                            </Badge>
                        ) : (
                            <Badge className="h-6 gap-1.5 bg-warning/12 px-2.5 font-semibold text-warning">
                                <ShieldAlertIcon aria-hidden="true" />
                                Email not verified
                            </Badge>
                        )}

                        {user.username && (
                            <span className="text-sm text-muted-foreground">
                                @{user.username}
                            </span>
                        )}
                    </div>
                </Reveal>
            </div>
        </section>
    )
}
