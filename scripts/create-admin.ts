import "dotenv/config"
import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma"

type CliArgs = {
  email: string
  password: string
  name: string
  promote: boolean
}

function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return undefined
  return process.argv[idx + 1]
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function parseArgs(): CliArgs {
  const email = (readArg("--email") ?? process.env.ADMIN_EMAIL)?.trim().toLowerCase()
  const password = readArg("--password") ?? process.env.ADMIN_PASSWORD
  const name = (readArg("--name") ?? process.env.ADMIN_NAME ?? "Admin").trim()
  const promote = hasFlag("--promote")

  if (!email || !password) {
    console.error(`
Admin hesabı oluşturma

Kullanım:
  npm run admin:create -- --email admin@ornek.com --password sifre123 --name "Site Yöneticisi"
  npm run admin:create -- --email admin@ornek.com --password sifre123 --promote

Ortam değişkenleri (alternatif):
  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME

Seçenekler:
  --email      Admin e-posta adresi (zorunlu)
  --password   Admin şifresi, en az 6 karakter (zorunlu)
  --name       Görünen ad (varsayılan: Admin)
  --promote    E-posta zaten kayıtlıysa rolü ADMIN yap
`)
    process.exit(1)
  }

  if (password.length < 6) {
    console.error("Hata: Şifre en az 6 karakter olmalıdır.")
    process.exit(1)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Hata: Geçerli bir e-posta adresi girin.")
    process.exit(1)
  }

  return { email, password, name, promote }
}

async function main() {
  const { email, password, name, promote } = parseArgs()
  const passwordHash = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true },
  })

  if (existing) {
    if (!promote && existing.role !== "ADMIN") {
      console.error(
        `Hata: ${email} zaten kayıtlı (rol: ${existing.role}). Mevcut kullanıcıyı admin yapmak için --promote ekleyin.`
      )
      process.exit(1)
    }

    const user = await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        passwordHash,
        name,
        isActive: true,
        emailVerified: true,
      },
      select: { id: true, email: true, name: true, role: true },
    })

    console.log("Admin hesabı güncellendi:")
    console.log(`  ID:    ${user.id}`)
    console.log(`  Ad:    ${user.name}`)
    console.log(`  E-posta: ${user.email}`)
    console.log(`  Rol:   ${user.role}`)
    return
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
    select: { id: true, email: true, name: true, role: true },
  })

  console.log("Admin hesabı oluşturuldu:")
  console.log(`  ID:    ${user.id}`)
  console.log(`  Ad:    ${user.name}`)
  console.log(`  E-posta: ${user.email}`)
  console.log(`  Rol:   ${user.role}`)
  console.log("\nGiriş: /login → ardından /admin")
}

main()
  .catch((error) => {
    console.error("Admin oluşturma hatası:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
