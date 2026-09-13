import type { Role } from '../models/userModels';

const PublicPolicy = {
    type: 'public',
} as const;

const GuestPolicy = {
    type: 'guest',
} as const;

type ProtectedPolicy = {
    type: 'protected';
    roles?: Role[];
    requireVerified?: boolean;
    owner?: boolean;
};

export type RoutePolicyType = typeof PublicPolicy | typeof GuestPolicy | ProtectedPolicy;

export const RoutePolicy = {
    public: (): RoutePolicyType => PublicPolicy,

    guest: (): RoutePolicyType => GuestPolicy,

    protected: (
        roles?: Role[],
        opts?: { requireVerified?: boolean; owner?: boolean },
    ): ProtectedPolicy => ({
        type: 'protected',
        roles,
        ...opts
    }),
};