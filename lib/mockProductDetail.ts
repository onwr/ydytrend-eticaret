import {
  mapApiProductToDetailViewModel,
  type ProductDetailViewModel,
} from "@/lib/productDetailShape"

const mockProductSource = [
  {
    id: 1,
    slug: "altin-kaplama-zarif-kolye",
    name: "Altın Kaplama Zarif Kolye",
    category: { name: "Kolye" },
    basePrice: 349.9,
    attributes: {
      Marka: "YDY Trend",
      Materyal: "Çelik / Altın Kaplama",
      "Kolye Uzunluğu": "45 cm + 5 cm uzatma",
      "Su Geçirmezlik": "Havuz / Deniz Uyumlu Değil",
    } as Record<string, string>,
    images: [
      { url: "/urunler/urun1.jpg", alt: "Altın kolye ön görünüm" },
      { url: "/urunler/urun2.jpg", alt: "Altın kolye yakın çekim" },
      { url: "/urunler/urun3.jpg", alt: "Kolyenin model üzerindeki görünümü" },
    ],
    variants: [
      {
        id: 101,
        name: "Standart",
        sku: "YDY-KL-001-ST",
        price: 349.9,
        stock: 12,
        attributes: { Renk: "Altın", Uzunluk: "45 cm" },
      },
      {
        id: 102,
        name: "Uzun",
        sku: "YDY-KL-001-LG",
        price: 369.9,
        stock: 8,
        attributes: { Renk: "Altın", Uzunluk: "60 cm" },
      },
    ],
    description: "Zarif tasarımı ile günlük ve özel günlerde kolaylıkla kombinlenebilen altın kaplama kolye.",
    compareAtPrice: 499.9,
    isFeatured: true,
  },
  {
    id: 2,
    slug: "toz-pembe-deri-kol-cantasi",
    name: "Toz Pembe Mini Deri Kol Çantası",
    category: { name: "Çanta" },
    basePrice: 899.0,
    attributes: {
      Marka: "YDY Trend",
      Materyal: "Suni Deri",
      Ölçüler: "22 x 16 x 8 cm",
      "İç Cep": "Var",
    } as Record<string, string>,
    images: [
      { url: "/urunler/urun3.jpg", alt: "Toz pembe çanta ön görünüm" },
      { url: "/urunler/urun4.jpg", alt: "Çanta detay görünümü" },
    ],
    variants: [
      {
        id: 201,
        name: "Toz Pembe",
        sku: "YDY-CNT-001-PNK",
        price: 899.0,
        stock: 5,
        attributes: { Renk: "Toz Pembe" },
      },
      {
        id: 202,
        name: "Bej",
        sku: "YDY-CNT-001-BEJ",
        price: 899.0,
        stock: 7,
        attributes: { Renk: "Bej" },
      },
      {
        id: 203,
        name: "Siyah",
        sku: "YDY-CNT-001-SYH",
        price: 849.0,
        stock: 3,
        attributes: { Renk: "Siyah" },
      },
    ],
    description: "Günlük şıklığınızı tamamlayacak mini kol çantası. Fermuarlı ana bölmesi ve iç cebi ile pratik kullanım sunar.",
    compareAtPrice: 1199.0,
    isFeatured: true,
  },
  {
    id: 3,
    slug: "hasir-yaz-sapkasi",
    name: "Naturel Hasır Yaz Şapkası",
    category: { name: "Şapka" },
    basePrice: 249.9,
    attributes: {
      Marka: "YDY Trend",
      Materyal: "Naturel Hasır",
      "Ağız Çapı": "38 cm",
      Mevsim: "İlkbahar / Yaz",
    } as Record<string, string>,
    images: [
      { url: "/urunler/urun2.jpg", alt: "Hasır şapka üst görünüm" },
      { url: "/urunler/urun1.jpg", alt: "Hasır şapka model üzerinde" },
    ],
    variants: [
      {
        id: 301,
        name: "Naturel",
        sku: "YDY-SPK-001-NAT",
        price: 249.9,
        stock: 15,
        attributes: { Renk: "Naturel", Beden: "Tek Ebat" },
      },
    ],
    description: "Plaj ve tatil kombinleri için vazgeçilmez naturel hasır şapka. Geniş ağzı ile güneşten korur.",
    compareAtPrice: null,
    isFeatured: false,
  },
]

function mockToApiShape(m: (typeof mockProductSource)[number]) {
  return {
    ...m,
    compareAtPrice: m.compareAtPrice ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
    isFeatured: m.isFeatured ?? false,
    sku: m.variants[0]?.sku ?? "",
    stock: m.variants.reduce((s, v) => s + v.stock, 0),
    tags: [],
  }
}

export const MOCK_PRODUCT_DETAILS: ProductDetailViewModel[] = mockProductSource.map((m) =>
  mapApiProductToDetailViewModel(mockToApiShape(m))
)

export function getMockProductBySlug(slug: string): ProductDetailViewModel | undefined {
  return MOCK_PRODUCT_DETAILS.find((p) => p.slug === slug)
}
