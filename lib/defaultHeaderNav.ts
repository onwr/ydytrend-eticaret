/** Üst header menüsü — DB boş / API hata durumunda yedek; seed ile uyumlu alanlar */
export type DefaultHeaderNavRow = {
  label: string
  href: string
  labelUppercase: boolean
  sortOrder: number
  isActive: boolean
  openInNewTab: boolean
}

export const DEFAULT_HEADER_NAV_ITEMS: DefaultHeaderNavRow[] = [
  { label: "Yeni Gelenler", href: "/categories", labelUppercase: false, sortOrder: 0, isActive: true, openInNewTab: false },
  { label: "Takı", href: "/categories/taki", labelUppercase: false, sortOrder: 1, isActive: true, openInNewTab: false },
  { label: "Çanta", href: "/categories/canta", labelUppercase: false, sortOrder: 2, isActive: true, openInNewTab: false },
  { label: "Şapka", href: "/categories/sapka", labelUppercase: false, sortOrder: 3, isActive: true, openInNewTab: false },
  { label: "Aksesuar", href: "/categories/aksesuar", labelUppercase: false, sortOrder: 4, isActive: true, openInNewTab: false },
  { label: "Çok Satanlar", href: "/search?sort=popular", labelUppercase: false, sortOrder: 5, isActive: true, openInNewTab: false },
  { label: "İndirim", href: "/search?indirim=true", labelUppercase: false, sortOrder: 6, isActive: true, openInNewTab: false },
]
