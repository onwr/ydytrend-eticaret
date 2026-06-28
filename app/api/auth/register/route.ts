import bcrypt from "bcrypt"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { GUEST_CART_COOKIE, clearGuestCartCookieOnResponse } from "@/lib/cartSession"
import {
  GUEST_FAVORITES_COOKIE,
  clearGuestFavoritesCookieOnResponse,
} from "@/lib/favoriteSession"
import { signAccessToken } from "@/lib/jwt"
import { authTokenCookieOptions } from "@/lib/authCookies"
import { getClientIp } from "@/lib/getClientIp"
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit"
import { jsonRateLimited } from "@/lib/apiError"
import { mergeGuestCartIntoUserCart } from "@/lib/mergeGuestCart"
import { mergeGuestFavoritesIntoUser } from "@/lib/mergeGuestFavorites"
import { prisma } from "@/lib/prisma"

type RegisterBody = {
  name?: string
  email?: string
  password?: string
  phone?: string
  city?: string
  district?: string
  neighborhood?: string
  doorNo?: string
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = await consumeRateLimit(
      `register:${ip}`,
      RATE_LIMITS.register.max,
      RATE_LIMITS.register.windowMs
    )
    if (!rl.allowed) {
      return jsonRateLimited(rl.retryAfterSeconds ?? 3600)
    }

    const body = (await request.json()) as RegisterBody
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const phone = body.phone?.trim() || null
    
    // Address fields
    const city = body.city?.trim()
    const district = body.district?.trim()
    const neighborhood = body.neighborhood?.trim()
    const doorNo = body.doorNo?.trim()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Ad, e-posta ve şifre alanları zorunludur." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu e-posta ile kayıtlı kullanıcı zaten var." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        addresses: (city && district) ? {
          create: {
            title: "Varsayılan Adres",
            fullName: name,
            phone: phone || "",
            city: city,
            district: district,
            line1: `${neighborhood || ""} No: ${doorNo || ""}`.trim() || "Belirtilmedi",
            postalCode: "00000",
            country: "TR",
            isDefault: true
          }
        } : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    const cookieStore = await cookies()
    const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value
    let guestCartMerged = false
    if (guestToken && /^[a-f0-9]{64}$/i.test(guestToken)) {
      try {
        await mergeGuestCartIntoUserCart(prisma, user.id, guestToken)
        guestCartMerged = true
      } catch (mergeError) {
        console.error("Guest cart merge error:", mergeError)
      }
    }

    const guestFavoritesRaw = cookieStore.get(GUEST_FAVORITES_COOKIE)?.value
    let guestFavoritesMerged = false
    if (guestFavoritesRaw) {
      try {
        await mergeGuestFavoritesIntoUser(prisma, user.id, guestFavoritesRaw)
        guestFavoritesMerged = true
      } catch (mergeError) {
        console.error("Guest favorites merge error:", mergeError)
      }
    }

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      { message: "Kayıt başarılı ve giriş yapıldı.", user },
      { status: 201 }
    )

    response.cookies.set("token", token, authTokenCookieOptions())

    if (guestCartMerged) {
      clearGuestCartCookieOnResponse(response)
    }
    if (guestFavoritesMerged) {
      clearGuestFavoritesCookieOnResponse(response)
    }

    return response
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { message: "Kayıt sırasında beklenmeyen bir hata oluştu." },
      { status: 500 }
    )
  }
}
