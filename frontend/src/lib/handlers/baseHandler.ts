import { createAction } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';


export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const REFRESH_URL = '/auth/refresh';
const isServer = typeof window === 'undefined';

export interface ApiExtra {
    cookie?: string;
}

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { extra }) => {
        const { cookie } = (extra ?? {}) as ApiExtra;

        if (isServer && cookie) {
            headers.set('cookie', cookie);
        }

        return headers;
    },
});


export const sessionExpired = createAction('api/sessionExpired');

let refreshing: Promise<boolean> | null = null;

const refreshSession = (api: BaseQueryApi, extraOptions: object): Promise<boolean> =>
    (refreshing ??= Promise.resolve(rawBaseQuery({ url: REFRESH_URL, method: 'POST' }, api, extraOptions))
        .then((result) => !result.error)
        .finally(() => {
            refreshing = null;
        }));

const urlOf = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

/**
 * Renews the session once on a 401 and replays the request.
 *
 * Skipped for `/auth/*`, where a 401 is the answer (bad credentials, expired
 * link) rather than an expired session — and on the server, which cannot hand
 * the rotated cookies back to the browser and would revoke the visitor's
 * session by refreshing on their behalf.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions,
) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401 || isServer || urlOf(args).startsWith('/auth/')) {
        return result;
    }

    if (!(await refreshSession(api, extraOptions))) {
        api.dispatch(sessionExpired());
        return result;
    }

    return rawBaseQuery(args, api, extraOptions);
};

export const baseHandler = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['User', 'Session', 'Catalog', 'Cart'],
    keepUnusedDataFor: 60,
    refetchOnReconnect: true,
    endpoints: () => ({}),
});

export default baseHandler;
