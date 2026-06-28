import { prisma } from "@/lib/prisma"

export type FaqPublic = {
  id: number
  question: string
  answer: string
  category: string | null
  sortOrder: number
}

export const FALLBACK_HOME_FAQS: FaqPublic[] = [
  {
    id: -1,
    category: "Sipariş & Kargo",
    sortOrder: 1,
    question: "Siparişimi ne zaman kargoya verirsiniz?",
    answer:
      "Ödemeniz onaylandıktan sonra siparişiniz aynı iş günü içinde veya en geç 1–2 iş günü içinde kargoya teslim edilir. Kampanya ve yoğun dönemlerde bu süre kısa süreli uzayabilir; güncel bilgi için sipariş detayınızı veya müşteri hizmetlerimizi kullanabilirsiniz.",
  },
  {
    id: -2,
    category: "Sipariş & Kargo",
    sortOrder: 2,
    question: "Kargo ücreti nasıl hesaplanıyor?",
    answer:
      "Sepet tutarınıza ve seçtiğiniz teslimat adresine göre kargo ücreti ödeme adımında net olarak gösterilir. Belirli tutarın üzerindeki siparişlerde ücretsiz kargo kampanyalarımız olabilir; kampanya koşulları sepet sayfasında belirtilir.",
  },
  {
    id: -3,
    category: "İade & Değişim",
    sortOrder: 3,
    question: "Ürünü iade edebilir miyim?",
    answer:
      "Mesafeli satış kapsamındaki ürünlerde yasal cayma hakkınız ve mağaza politikamıza uygun olarak açılmamış, kullanılmamış ve orijinal ambalajındaki ürünleri belirtilen süre içinde iade edebilirsiniz. Kişisel veri içeren veya mühürü açılmış yazılım/lisans ürünlerinde iade kabul edilmeyebilir; detaylar İade Koşulları sayfamızda yer alır.",
  },
  {
    id: -4,
    category: "İade & Değişim",
    sortOrder: 4,
    question: "İade ücreti kimden kesilir?",
    answer:
      "Cayma hakkı kullanımında iade kargo ücreti müşteri tarafından karşılanabilir; kampanya veya kusurlu ürün durumunda farklılık gösterebilir. İade onayı sonrası ödeme iadeniz, ödeme yönteminize göre birkaç iş günü içinde hesabınıza yansır.",
  },
  {
    id: -5,
    category: "Ürün & Garanti",
    sortOrder: 5,
    question: "Ürünleriniz orijinal mi ve garanti kapsamı nedir?",
    answer:
      "Ürünlerimizin uyumluluk ve garanti koşullarını ürün sayfalarında belirtiyoruz. Garanti süresi ve kapsamı ürüne göre değişir; detaylar için müşteri hizmetlerimizle iletişime geçebilirsiniz.",
  },
  {
    id: -6,
    category: "Ürün & Güvenlik",
    sortOrder: 6,
    question: "Stokta olmayan ürün ne zaman gelir?",
    answer:
      "Tükenen ürünler için tedarik tarihi net olmayabilir. Ürün sayfasında “Gelince haber ver” veya benzeri bir seçenek varsa e-posta ile bilgilendirilebilirsiniz; ayrıca müşteri hizmetlerimizden stok durumu hakkında güncel bilgi alabilirsiniz.",
  },
]

export async function getFaqsForHome(): Promise<FaqPublic[]> {
  try {
    const rows = await prisma.faq.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      take: 50,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        sortOrder: true,
      },
    })
    if (rows.length > 0) {
      return rows
    }
  } catch {
    // DB bağlantısı yok veya migrate edilmemiş
  }
  return FALLBACK_HOME_FAQS
}

/** Tüm sayfa: yayındaki tüm aktif kayıtlar (sadece anasayfa olanlar değil). */
export const FALLBACK_ALL_FAQS: FaqPublic[] = [
  ...FALLBACK_HOME_FAQS,
  {
    id: -7,
    category: "Hesap",
    sortOrder: 7,
    question: "Şifremi unuttum, ne yapmalıyım?",
    answer:
      "Giriş sayfasındaki “Şifremi unuttum” bağlantısından e-posta adresinizi girerek sıfırlama bağlantısı talep edebilirsiniz. E-posta gelmezse spam klasörünü kontrol edin veya destek hattımızdan yardım isteyin.",
  },
]

export async function getFaqsForPage(): Promise<FaqPublic[]> {
  try {
    const rows = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      take: 200,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        sortOrder: true,
      },
    })
    if (rows.length > 0) {
      return rows
    }
  } catch {
    // DB yok / migrate yok
  }
  return FALLBACK_ALL_FAQS
}
