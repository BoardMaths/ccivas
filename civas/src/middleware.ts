import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth

export const config = {
    matcher: [
        // Protect all dashboard routes
        "/dashboard/:path*",
        // Protect API routes (except auth endpoints & registration)
        "/api/((?!auth|register).*)",
    ]
}
