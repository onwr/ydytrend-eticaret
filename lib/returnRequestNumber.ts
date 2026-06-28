import type { Prisma } from "@/generated/prisma/client"

type Tx = Prisma.TransactionClient

export async function generateReturnRequestNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear()
  let counter = await tx.returnRequestCounter.findUnique({ where: { id: 1 } })
  if (!counter) {
    counter = await tx.returnRequestCounter.create({
      data: { id: 1, year, lastNumber: 0 },
    })
  }
  let lastNumber = counter.lastNumber
  if (counter.year !== year) {
    lastNumber = 0
  }
  const next = lastNumber + 1
  await tx.returnRequestCounter.update({
    where: { id: 1 },
    data: { year, lastNumber: next },
  })
  return `YDY-RMA-${year}-${String(next).padStart(6, "0")}`
}
