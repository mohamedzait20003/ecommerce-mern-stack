import { useMemo, type ReactNode } from "react"

import { Reveal, Stagger } from "@/common/components/animation/reveal"
import { useScrollSpy } from "@/lib/hooks/useScrollSpy"

import { SectionList } from "./profile-nav"

/**
 * The frame every settings page sits in.
 *
 * Each page is a stack of cards with the same rhythm and the same
 * on-this-page list, so it lives here rather than being spelled out five times.
 * The list is the same scroll spy the policy documents use — one behaviour, one
 * place to tune it.
 *
 * The cards stagger in rather than appearing together: they are a list, and a
 * list that arrives in order is a list you can read as one.
 */
export function SettingsPage({
    title,
    description,
    sections,
    children,
}: Readonly<{
    title: string
    description: string
    /** Anchors on this page, in document order, for the contents list. */
    sections: { id: string; label: string }[]
    children: ReactNode
}>) {
    const ids = useMemo(() => sections.map((section) => section.id), [sections])
    const active = useScrollSpy(ids)

    return (
        <div className="grid gap-8 xl:grid-cols-[1fr_13rem] xl:gap-10">
            <div className="min-w-0">
                <Reveal as="header" className="mb-6">
                    <h1 className="font-heading text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">
                        {description}
                    </p>
                </Reveal>

                <Stagger step={70} className="flex flex-col gap-5">
                    {children}
                </Stagger>
            </div>

            <div className="xl:sticky xl:top-24 xl:self-start">
                <SectionList items={sections} active={active} />
            </div>
        </div>
    )
}
