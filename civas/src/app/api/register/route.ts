import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// ─── Input Validation ──────────────────────────────────────────────────────
const registerSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
        .max(255, "Email too long")
        .transform((e) => e.toLowerCase().trim()),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password too long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
})

// ─── Simple in-memory rate limiter (per IP) ─────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5 // max 5 registrations per window

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
        return false
    }

    entry.count++
    return entry.count > RATE_LIMIT_MAX
}

export async function POST(req: Request) {
    try {
        // ── Rate limiting ──────────────────────────────────────────────
        const forwarded = req.headers.get("x-forwarded-for")
        const ip = forwarded?.split(",")[0]?.trim() || "unknown"

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Too many registration attempts. Please try again later." },
                { status: 429 }
            )
        }

        // ── Parse & validate body ──────────────────────────────────────
        const body = await req.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0].message },
                { status: 400 }
            )
        }

        const { email, password, firstName, lastName } = parsed.data

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            // Return a generic message to prevent user enumeration
            return NextResponse.json(
                { error: "Unable to create account. Please try a different email." },
                { status: 400 }
            )
        }

        // Hash password with strong cost factor
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const name = [firstName, lastName].filter(Boolean).join(" ") || null

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                firstName: firstName || null,
                lastName: lastName || null,
            }
        })

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "An error occurred during registration" },
            { status: 500 }
        )
    }
}
