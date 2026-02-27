import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register"

            // Authenticated user visiting login/register → redirect to dashboard
            if (isLoggedIn && isOnAuthPage) {
                return Response.redirect(new URL("/dashboard", nextUrl))
            }

            // Unauthenticated user visiting protected routes → redirect to login
            if (!isLoggedIn && isOnDashboard) {
                return false // NextAuth will redirect to pages.signIn
            }

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session
        }
    },
    providers: []
} satisfies NextAuthConfig
