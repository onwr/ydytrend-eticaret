import type { PrismaClient } from "@/generated/prisma/client"
import { parseGuestFavoriteIds } from "@/lib/favoriteSession"

export async function mergeGuestFavoritesIntoUser(
  prisma: PrismaClient,
  userId: number,
  guestFavoritesRaw: string | undefined
): Promise<void> {
  const productIds = parseGuestFavoriteIds(guestFavoritesRaw)
  if (productIds.length === 0) return

  for (const productId of productIds) {
    await prisma.favorite.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      create: { userId, productId },
      update: {},
    })
  }
}
