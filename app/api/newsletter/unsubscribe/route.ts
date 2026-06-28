import { NextResponse } from "next/server"
import { NewsletterStatus } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")?.trim()

    if (!token) {
      return NextResponse.json({ message: "Geçersiz bağlantı." }, { status: 400 })
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    })

    if (!subscriber) {
      return NextResponse.json({ message: "Abonelik bulunamadı." }, { status: 404 })
    }

    if (subscriber.status === NewsletterStatus.UNSUBSCRIBED) {
      return NextResponse.json({
        message: "Bu e-posta zaten abonelikten çıkmış.",
        email: subscriber.email,
        alreadyUnsubscribed: true,
      })
    }

    return NextResponse.json({
      message: "Abonelikten çıkmak için onaylayın.",
      email: subscriber.email,
      alreadyUnsubscribed: false,
    })
  } catch (error) {
    console.error("Newsletter unsubscribe GET error:", error)
    return NextResponse.json({ message: "İşlem tamamlanamadı." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string }
    const token = body.token?.trim()

    if (!token) {
      return NextResponse.json({ message: "Geçersiz bağlantı." }, { status: 400 })
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    })

    if (!subscriber) {
      return NextResponse.json({ message: "Abonelik bulunamadı." }, { status: 404 })
    }

    if (subscriber.status !== NewsletterStatus.UNSUBSCRIBED) {
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: NewsletterStatus.UNSUBSCRIBED,
          unsubscribedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ message: "Bülten aboneliğiniz iptal edildi." })
  } catch (error) {
    console.error("Newsletter unsubscribe POST error:", error)
    return NextResponse.json({ message: "İşlem tamamlanamadı." }, { status: 500 })
  }
}
