import { useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import type { CredentialResponse } from "@react-oauth/google"

import { navUrls } from "@/lib/utils/navUrls"
import { currentLanding, landingFor } from "@/lib/auth/session"
import baseHandler from "@/lib/handlers/baseHandler"
import {
    useForgotPasswordMutation,
    useGoogleSignInMutation,
    useResetPasswordMutation,
    useSignInMutation,
    useSignOutMutation,
    useSignUpMutation,
    useVerifyEmailMutation,
} from "@/lib/handlers/userHandlers"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { cartUiReset } from "@/store/slices/cartSlice"
import { selectUser } from "@/store/slices/userSlice"

import type {
    AuthenticatedUser,
    PassForgetRequest,
    PassResetRequest,
    SignInRequest,
    SignUpRequest,
} from "@/lib/models/userModels"

type OnFailure = () => void

/**
 * Where a freshly authenticated user belongs.
 *
 * Read off the response rather than by navigating to the root and letting the
 * guest guard bounce: route middleware only runs when `future.v8_middleware`
 * is set on the router, and it is not, so nothing bounces and everyone landed
 * on the visitor home page instead of their own section.
 *
 * Reuses `landingFor` so this agrees with the guard and the navbar about the
 * answer, including sending an unverified account to the verification notice.
 */
const landingForUser = (user: AuthenticatedUser): string =>
    landingFor({
        role: user.role,
        isVerified: user.verified,
        publicUserId: user.publicUserId,
    })


export function useUser() {
    const user = useAppSelector(selectUser)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const [signOut, { isLoading: isLoggingOut }] = useSignOutMutation()

    const logout = useCallback(async () => {
        try {
            await signOut().unwrap()
        } catch (error) {
            console.error("Logout failed:", error)
            toast.error("Logout failed. Please try again.")
            return
        }

        dispatch(baseHandler.util.resetApiState())
        dispatch(cartUiReset())
        toast.success("Logged out successfully")
        navigate(navUrls.landing.home)
    }, [signOut, dispatch, navigate])

    return {
        user,
        role: user.role,
        isAuthenticated: user.isAuthenticated,
        isVerified: user.isVerified,
        logout,
        isLoggingOut,
    }
}

export function useLogin(onFailure?: OnFailure) {
    const navigate = useNavigate()
    const [signIn, { isLoading, error }] = useSignInMutation()

    const login = useCallback(
        async (credentials: SignInRequest) => {
            let user: AuthenticatedUser

            try {
                user = await signIn(credentials).unwrap()
            } catch (err) {
                console.error("Login failed:", err)
                toast.error("That did not work. Check your email and password.")
                onFailure?.()
                return false
            }

            toast.success("Welcome back.")
            navigate(landingForUser(user))
            return true
        },
        [signIn, navigate, onFailure],
    )

    return { login, isLoading, error }
}

export function useSignUp(onFailure?: OnFailure) {
    const navigate = useNavigate()
    const [signUp, { isLoading, error }] = useSignUpMutation()

    const register = useCallback(
        async (details: SignUpRequest) => {
            try {
                await signUp(details).unwrap()
            } catch (err) {
                console.error("Signup failed:", err)
                toast.error("We could not create your account. Please try again.")
                onFailure?.()
                return false
            }

            toast.success("Account created. Check your email to verify it.")
            navigate(navUrls.auth.accountVerify)
            return true
        },
        [signUp, navigate, onFailure],
    )

    return { register, isLoading, error }
}

export function useGoogleAuth(onFailure?: OnFailure) {
    const navigate = useNavigate()
    const [googleSignIn, { isLoading, error }] = useGoogleSignInMutation()

    const onSuccess = useCallback(
        async (credentialResponse: CredentialResponse) => {
            const idToken = credentialResponse.credential

            if (!idToken) {
                toast.error("Google did not return a credential. Please try again.")
                onFailure?.()
                return false
            }

            let user: AuthenticatedUser

            try {
                user = await googleSignIn({ idToken }).unwrap()
            } catch (err) {
                console.error("Google login failed:", err)
                toast.error("Google sign-in failed. Please try again.")
                onFailure?.()
                return false
            }

            toast.success("Signed in with Google.")
            navigate(landingForUser(user))
            return true
        },
        [googleSignIn, navigate, onFailure],
    )

    const onError = useCallback(() => {
        console.error("Google login failed")
        toast.error("Google sign-in failed. Please try again.")
        onFailure?.()
    }, [onFailure])

    return { onSuccess, onError, isLoading, error }
}

const VERIFIED_REDIRECT_MS = 5000

export function useEmailVerification(token: string | null) {
    const navigate = useNavigate()
    const [verifyEmail, { isLoading, isSuccess, error }] = useVerifyEmailMutation()

    useEffect(() => {
        if (!token) {
            return
        }

        let timer: ReturnType<typeof setTimeout> | undefined

        verifyEmail({ token })
            .unwrap()
            .then(() => {
                toast.success("Email verified.")
                timer = setTimeout(() => navigate(currentLanding()), VERIFIED_REDIRECT_MS)
            })
            .catch((err: unknown) => {
                console.error("Verification failed:", err)
                toast.error("We could not verify that link.")
            })

        return () => clearTimeout(timer)
    }, [token, verifyEmail, navigate])

    return { isLoading, isSuccess, error }
}

/**
 * Requests a reset link.
 *
 * Stays on the page: the next step happens in the reader's inbox, and the form
 * shows its own sent-state from `isSuccess`.
 */
export function usePasswordForgot(onFailure?: OnFailure) {
    const [forgotPassword, { isLoading, isSuccess, error }] = useForgotPasswordMutation()

    const requestReset = useCallback(
        async (body: PassForgetRequest) => {
            try {
                await forgotPassword(body).unwrap()
            } catch (err) {
                console.error("Password reset failed:", err)
                toast.error("We could not send that email. Please try again.")
                onFailure?.()
                return false
            }

            toast.success("Reset link sent. Check your email.")
            return true
        },
        [forgotPassword, onFailure],
    )

    return { requestReset, isLoading, isSuccess, error }
}

/**
 * Sets a new password from an emailed token.
 *
 * Ends on the confirmation page rather than signed in: the endpoint clears the
 * session on success, so anywhere else would bounce back to sign-in anyway.
 */
export function usePasswordReset(onFailure?: OnFailure) {
    const navigate = useNavigate()
    const [resetPassword, { isLoading, error }] = useResetPasswordMutation()

    const submit = useCallback(
        async (body: PassResetRequest) => {
            try {
                await resetPassword(body).unwrap()
            } catch (err) {
                console.error("Password reset failed:", err)
                toast.error("We could not change your password. Please try again.")
                onFailure?.()
                return false
            }

            toast.success("Password changed.")
            navigate(navUrls.auth.passwordConfirm)
            return true
        },
        [resetPassword, navigate, onFailure],
    )

    return { resetPassword: submit, isLoading, error }
}
