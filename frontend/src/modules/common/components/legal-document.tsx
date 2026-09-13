import { useMemo } from "react"
import { ArrowUpIcon, InfoIcon } from "lucide-react"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/common/components/ui/accordion"
import { Reveal } from "@/common/components/animation/reveal"
import { useScrollSpy } from "@/lib/hooks/useScrollSpy"
import { cn } from "@/lib/utils/utils"

export type LegalBlock =
    | { kind: "p"; text: string }
    | { kind: "h3"; text: string }
    | { kind: "list"; items: string[] }
    /** Plain-English summary of the section it opens. */
    | { kind: "note"; text: string }

export interface LegalSection {
    id: string
    title: string
    blocks: LegalBlock[]
}

function Blocks({ blocks }: Readonly<{ blocks: LegalBlock[] }>) {
    return (
        <>
            {blocks.map((block, index) => {
                switch (block.kind) {
                    case "note":
                        return (
                            <p
                                key={index}
                                className="mb-6 flex gap-3 rounded-2xl bg-info/8 p-4 text-base text-pretty text-foreground"
                            >
                                <InfoIcon
                                    aria-hidden="true"
                                    className="mt-0.5 size-5 shrink-0 text-info"
                                />
                                <span>
                                    <span className="font-semibold">In short: </span>
                                    {block.text}
                                </span>
                            </p>
                        )
                    case "h3":
                        return (
                            <h3
                                key={index}
                                className="mt-8 mb-3 font-heading text-lg font-bold text-balance"
                            >
                                {block.text}
                            </h3>
                        )
                    case "list":
                        return (
                            <ul key={index} className="mb-5 flex flex-col gap-2.5">
                                {block.items.map((item) => (
                                    <li
                                        key={item}
                                        className="flex gap-3 text-pretty text-muted-foreground"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/60"
                                        />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )
                    default:
                        return (
                            <p key={index} className="mb-5 text-pretty text-muted-foreground">
                                {block.text}
                            </p>
                        )
                }
            })}
        </>
    )
}

function TocLink({
    section,
    index,
    active,
}: Readonly<{ section: LegalSection; index: number; active: boolean }>) {
    return (
        <a
            href={`#${section.id}`}
            aria-current={active ? "true" : undefined}
            className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors outline-none",
                "hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
            )}
        >
            <span className="tabular-nums opacity-60">{index + 1}.</span>
            <span className="text-pretty">{section.title}</span>
        </a>
    )
}

/**
 * Layout for a policy document.
 *
 * A wall of numbered clauses is unreadable without a way in, so the contents
 * sit beside it on desktop and follow the reader down the page; on a phone the
 * same list collapses into one accordion rather than pushing the document
 * itself below the fold.
 *
 * Every section is anchored, which makes each clause linkable — the thing
 * people actually need when they are asking support about clause 7.
 */
export function LegalDocument({ sections }: Readonly<{ sections: LegalSection[] }>) {
    // Memoised because `useScrollSpy` re-observes whenever the array identity
    // changes, and `sections` is a stable prop.
    const ids = useMemo(() => sections.map((section) => section.id), [sections])
    const active = useScrollSpy(ids)

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <h2 className="mb-3 hidden text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase lg:block">
                        On this page
                    </h2>

                    <nav aria-label="Contents" className="hidden lg:block">
                        <ul className="flex flex-col gap-0.5">
                            {sections.map((section, index) => (
                                <li key={section.id}>
                                    <TocLink
                                        section={section}
                                        index={index}
                                        active={section.id === active}
                                    />
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Same list, collapsed, for screens too narrow for a sidebar. */}
                    <Accordion className="lg:hidden">
                        <AccordionItem value="contents">
                            <AccordionTrigger className="font-semibold hover:no-underline">
                                Jump to a section
                            </AccordionTrigger>
                            <AccordionContent className="px-0">
                                <ul className="flex flex-col gap-0.5">
                                    {sections.map((section, index) => (
                                        <li key={section.id}>
                                            <TocLink
                                                section={section}
                                                index={index}
                                                active={false}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </aside>

                <div className="min-w-0">
                    {sections.map((section, index) => (
                        <Reveal
                            key={section.id}
                            as="section"
                            id={section.id}
                            className="scroll-mt-24 border-b border-border pt-10 pb-8 first:pt-0 last:border-b-0"
                        >
                            <h2 className="mb-4 flex gap-3 font-heading text-2xl font-extrabold tracking-tight text-balance">
                                <span aria-hidden="true" className="text-primary tabular-nums">
                                    {index + 1}.
                                </span>
                                {section.title}
                            </h2>
                            <Blocks blocks={section.blocks} />
                        </Reveal>
                    ))}

                    <a
                        href="#main-content"
                        className="mt-10 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                        <ArrowUpIcon aria-hidden="true" className="size-4" />
                        Back to the top
                    </a>
                </div>
            </div>
        </div>
    )
}
