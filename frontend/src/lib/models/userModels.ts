/**
 * The roles as the database spells them.
 *
 * `roles.name` is seeded uppercase in V1__user.sql, the backend puts
 * `role.getName()` straight into the session cookie and the auth response, and
 * Spring maps the same value to a `ROLE_` authority. So uppercase is the
 * contract, and comparing against anything else silently matches nothing.
 */
export const ROLE = {
    ADMIN: 'ADMIN',
    CUSTOMER: 'CUSTOMER',
} as const;

/**
 * A union rather than `string`, so a mis-spelled role is a build error instead
 * of a comparison that is quietly always false. A new role added to the table
 * belongs here too - and the compiler will point at every place that has to
 * decide what it means.
 */
export type Role = (typeof ROLE)[keyof typeof ROLE] | null;
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: Role;
    verified: boolean;
    publicUserId: string | null;
}

/** One signed-in device, as listed under Profile → Security. */
export interface UserSession {
    deviceType: string;
    location: string;
    deviceOS: string;
    lastUsedAt: string;
}

export interface UserProfile {
    isActivityTracked: boolean;
    isDataShared: boolean;
    isEmailNotified: boolean;
    isSecurityNotified: boolean;
    isUpdateNotified: boolean;
}

export interface UserState {
    id: string | null;
    publicUserId: string | null;

    role: Role;
    isVerified: boolean;
    isAuthenticated: boolean;
    

    firstName: string;
    lastName: string;
    displayName: string;
    username: string;
    email: string;

    profilePicURL?: string;

    faEnabled: boolean;
    gender?: Gender;

    locale: string;
    timeZone: string;
    dateOfBirth: string;

    // --- profile ---
    customerProfile?: UserProfile;
}

// --- requests ---

export interface SignInRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    fname: string;
    lname: string;
    username: string;
    email: string;
    password: string;
    gender?: Gender;
    dateOfBirth: string;
}

export interface GoogleSignInRequest {
    idToken: string;
}

export interface VerifyEmailRequest {
    token: string;
}

export interface PassForgetRequest {
    email: string;
}

export interface PassResetRequest {
    token: string;
    password: string;
    passwordConfirmation: string;
}

export interface UpdatePictureRequest {
    picture: File;
}
