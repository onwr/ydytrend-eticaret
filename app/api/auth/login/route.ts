import bcrypt from "bcrypt"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { clearGuestCartCookieOnResponse, GUEST_CART_COOKIE } from "@/lib/cartSession"
import {
  clearGuestFavoritesCookieOnResponse,
  GUEST_FAVORITES_COOKIE,
} from "@/lib/favoriteSession"
import { signAccessToken } from "@/lib/jwt"
import { authTokenCookieOptions } from "@/lib/authCookies"
import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"
import { jsonInternalError, jsonRateLimited, withRequestIdHeader } from "@/lib/apiError"
import { mergeGuestCartIntoUserCart } from "@/lib/mergeGuestCart"
import { mergeGuestFavoritesIntoUser } from "@/lib/mergeGuestFavorites"
import { prisma } from "@/lib/prisma"
import {
  AdminActivityAction,
  logAdminActivity,
  logSecurityEvent,
} from "@/lib/adminActivityLog"
import { logger } from "@/lib/logger"

type LoginBody = {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await consumeRateLimit(
      `login:${ip}`,
      RATE_LIMITS.login.max,
      RATE_LIMITS.login.windowMs
    )
    if (!rl.allowed) {
      return jsonRateLimited(rl.retryAfterSeconds ?? 900, request)
    }

    const body = (await request.json()) as LoginBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email ve şifre alanları zorunludur." },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        emailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: "E-posta veya sifre hatali." },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      if (user.role === "ADMIN") {
        await logSecurityEvent(prisma, {
          action: AdminActivityAction.ADMIN_LOGIN_FAILED,
          actorEmail: user.email,
          actorUserId: user.id,
          resourceType: "User",
          resourceId: String(user.id),
          metadata: { reason: "account_inactive" },
          request,
        })
      }
      return NextResponse.json(
        { message: "Kullanici hesabi pasif durumda." },
        { status: 403 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      if (user.role === "ADMIN") {
        await logSecurityEvent(prisma, {
          action: AdminActivityAction.ADMIN_LOGIN_FAILED,
          actorEmail: user.email,
          actorUserId: user.id,
          resourceType: "User",
          resourceId: String(user.id),
          metadata: { reason: "invalid_password" },
          request,
        })
      }
      return NextResponse.json(
        { message: "E-posta veya sifre hatali." },
        { status: 401 }
      )
    }

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const cookieStore = await cookies()
    const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value
    let guestCartMerged = false
    if (guestToken && /^[a-f0-9]{64}$/i.test(guestToken)) {
      try {
        await mergeGuestCartIntoUserCart(prisma, user.id, guestToken)
        guestCartMerged = true
      } catch (mergeError) {
        logger.error("Guest cart merge failed", { userId: user.id })
      }
    }

    const guestFavoritesRaw = cookieStore.get(GUEST_FAVORITES_COOKIE)?.value
    let guestFavoritesMerged = false
    if (guestFavoritesRaw) {
      try {
        await mergeGuestFavoritesIntoUser(prisma, user.id, guestFavoritesRaw)
        guestFavoritesMerged = true
      } catch {
        logger.error("Guest favorites merge failed", { userId: user.id })
      }
    }

    const response = NextResponse.json(
      {
        message: "Giris basarili.",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    )

    response.cookies.set("token", token, authTokenCookieOptions())

    if (guestCartMerged) {
      clearGuestCartCookieOnResponse(response)
    }
    if (guestFavoritesMerged) {
      clearGuestFavoritesCookieOnResponse(response)
    }

    if (user.role === "ADMIN") {
      await logAdminActivity(prisma, { userId: user.id, email: user.email, role: user.role }, {
        action: AdminActivityAction.ADMIN_LOGIN,
        resourceType: "User",
        resourceId: String(user.id),
        metadata: { success: true },
        request,
      })
    }

    return withRequestIdHeader(request, response)
  } catch {
    logger.error("Login handler failed")
    return jsonInternalError("Giris sirasinda beklenmeyen bir hata olustu.", request)
  }
}
