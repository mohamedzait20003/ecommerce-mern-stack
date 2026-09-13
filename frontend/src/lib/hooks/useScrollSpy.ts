import { useEffect, useState } from "react"

/**
 * Which of `ids` is currently being read.
 *
 * The bottom margin discounts most of the screen, so the active entry tracks
 * what is under the top of the viewport rather than whatever happens to be
 * visible — otherwise every section on a tall screen qualifies at once. When
 * several still do, the first in document order wins, because that is the one
 * being read.
 *
 * Shared by the policy documents and the account settings pages: both are one
 * long column with a contents list beside it, and two copies of this would
 * drift the moment one of them was tuned.
 *
 * `ids` must be referentially stable — a module constant, or memoised — since
 * a fresh array each render would tear down and re-observe on every commit.
 *
 * @param ids element ids, in document order
 * @param rootMargin trigger band, defaulting to a strip just under the sticky bar
 */
export function useScrollSpy(
    ids: string[],
    rootMargin = "-96px 0px -80% 0px"
): string {
    const [active, setActive] = useState(ids[0] ?? "")

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return

        const nodes = ids
            .map((id) => document.getElementById(id))
            .filter((node): node is HTMLElement => node !== null)

        if (!nodes.length) return

        const seen = new Set<string>()
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) seen.add(entry.target.id)
                    else seen.delete(entry.target.id)
                }

                const current = ids.find((id) => seen.has(id))
                if (current) setActive(current)
            },
            { rootMargin }
        )

        nodes.forEach((node) => observer.observe(node))
        return () => observer.disconnect()
    }, [ids, rootMargin])

    return active
}
