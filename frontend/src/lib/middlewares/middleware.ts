import { redirect, type MiddlewareFunction } from 'react-router-dom';

import { navUrls } from '@/lib/utils/navUrls';

import type { RoutePolicyType } from '../auth/policy';
import { getSession, landingFor, type Session } from '../auth/session';

/**
 * Decides where a request carrying `session` should be sent instead, or null to
 * let it through.
 *
 * Shared by the client-side route middleware and the SSR guard so both enforce
 * exactly the same rules — a policy change can never apply to one and not the
 * other.
 */
export function evaluatePolicy(
    policy: RoutePolicyType,
    session: Session | null,
    url: URL,
    params: Readonly<Record<string, string | undefined>> = {},
): string | null {
    if (policy.type === 'public') {
        return null;
    }

    if (policy.type === 'guest') {
        if (!session) {
            return null;
        }

        // The company pages used to need an exception here, because they were
        // mounted inside this guest-only branch. They are a public sibling now,
        // so a guest-only URL means exactly that and the landing is the answer.
        const target = landingFor(session);

        // Never bounce a request to where it already is; that is a redirect loop.
        return target === url.pathname ? null : target;
    }

    if (!session) {
        const callbackUrl = encodeURIComponent(`${url.pathname}${url.search}`);
        return `${navUrls.auth.login}?callbackUrl=${callbackUrl}`;
    }

    if (policy.requireVerified !== false && !session.isVerified) {
        return navUrls.auth.accountVerify;
    }

    if (policy.roles && (!session.role || !policy.roles.includes(session.role))) {
        return navUrls.unauthorized;
    }

    // Someone else's id in the URL: send them to their own copy of the app.
    // Skipped while either side is unknown, so a session whose claims do not
    // carry the id yet is not locked out of its own pages.
    if (
        policy.owner &&
        params.publicUserId &&
        session.publicUserId &&
        params.publicUserId !== session.publicUserId
    ) {
        return landingFor(session);
    }

    return null;
}

/** Client-side route middleware. Runs on navigation, not during SSR. */
export const routeMiddleware = (policy: RoutePolicyType): MiddlewareFunction =>
    ({ request, params }) => {
        const target = evaluatePolicy(
            policy,
            getSession(request),
            new URL(request.url),
            params,
        );

        if (target) {
            throw redirect(target);
        }
    };

/**
 * Attaches a policy to a route in both forms it is needed:
 *
 * - `middleware` runs it on client-side navigation.
 * - `handle` exposes it to `matchRoutes`, which is how the SSR guard reads it.
 *
 * React Router's `createStaticHandler` never invokes route middleware, so
 * without the `handle` copy the server has no way to see the policy and every
 * direct URL hit would render a protected page before the client bounced it.
 *
 * ```ts
 * const AdminRoutes: RouteObject = {
 *     path: 'admin',
 *     ...guarded(RoutePolicy.protected(['ADMIN'])),
 *     element: <Layout />,
 * };
 * ```
 */
export const guarded = (policy: RoutePolicyType, extraHandle?: RouteHandleExtras) => ({
    handle: { policy, ...extraHandle },
    middleware: [routeMiddleware(policy)],
});

/**
 * What a route wants fetched before it renders on the server.
 *
 * RTK Query starts a request from an effect, and `renderToString` runs no
 * effects - so without this the server renders every query in its loading
 * state and the real data only arrives after hydration. Declaring the queries
 * on the route lets `entry-server` start them itself, wait, and render once
 * with the answer.
 *
 * The request is passed in because a page can need its own URL to know what to
 * ask for: the shop reads its filters out of the query string.
 */
export type RoutePrefetch = (request: Request) => unknown[];

export interface RouteHandleExtras {
    prefetch?: RoutePrefetch;
    status?: number;
}
