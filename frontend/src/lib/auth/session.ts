import { parseCookie } from 'cookie';

import cookies from '@/common/data/cookies.json';
import { navUrls, withUser } from '@/lib/utils/navUrls';
import { ROLE, type Role } from '@/lib/models/userModels';

export type Session = {
    role: Role;
    isVerified: boolean;
    publicUserId: string | null;
};

const readCookieHeader = (request: Request): string | null => typeof document === 'undefined' ? request.headers.get('Cookie') : document.cookie;


export function getSessionToken(request: Request): string | null {
    const header = readCookieHeader(request);

    if (!header) {
        return null;
    }

    return parseCookie(header)[cookies.session] ?? null;
}

export function getSession(request: Request): Session | null {
    const value = getSessionToken(request);

    if (!value) {
        return null;
    }

    try {
        const claims = JSON.parse(value) as Partial<Session>;

        return {
            role: claims.role ?? null,
            isVerified: claims.isVerified ?? false,
            publicUserId: claims.publicUserId ?? null,
        };
    } catch {
        return { role: null, isVerified: true, publicUserId: null };
    }
}

export function prefixFor(session: Session | null): string | null {
    if (!session?.publicUserId) {
        return null;
    }

    if (session.role === ROLE.ADMIN)
        return withUser(navUrls.admin.base, session.publicUserId);

    if (session.role === ROLE.CUSTOMER)
        return withUser(navUrls.customer.base, session.publicUserId);

    return null;
}

export const landingFor = (session: Session | null) => {
    if (!session)
        return navUrls.landing.home;

    if (!session.isVerified)
        return navUrls.auth.accountVerify;

    return prefixFor(session) ?? navUrls.landing.home;
};

export function currentLanding(): string {
    if (typeof document === 'undefined') {
        return navUrls.landing.home;
    }

    return landingFor(getSession(new Request(window.location.href)));
}
