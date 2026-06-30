"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { FaArrowLeft, FaArrowRight, FaTruck, FaShieldAlt, FaCheckCircle, FaBoxes } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import {
  HERO_DEFAULTS,
  HERO_FALLBACK_IMAGE,
  effectiveHeroStyle,
  resolveFullImageHref,
  resolveFullImageSources,
  type HeroSlideContent,
} from "@/lib/heroContent"

const FEATURE_ICONS = [FaTruck, FaShieldAlt, FaCheckCircle, FaBoxes] as const

function HeroVisualFallback() {
  return (
    <div className="relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:min-h-[320px]">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {["Takı", "Çanta", "Şapka", "Aksesuar"].map((label) => (
          <div
            key={label}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-center"
          >
            <div className="mb-2 h-10 w-10 rounded-full bg-brand-teal/20" />
            <span className="text-[11px] font-medium text-white/90 md:text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroVisual({ slide, alt }: { slide: HeroSlideContent; alt: string }) {
  const [imageError, setImageError] = useState(false)
  const src = slide.imageUrl?.trim() || HERO_FALLBACK_IMAGE

  if (imageError || !src) {
    return <HeroVisualFallback />
  }

  const image = (
    <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-2xl border border-white/10 md:min-h-[320px]">
      <Image
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 560px"
        onError={() => setImageError(true)}
      />
    </div>
  )

  if (slide.linkUrl) {
    return <Link href={slide.linkUrl}>{image}</Link>
  }

  return image
}

function FullImageHeroVisual({ slide, alt }: { slide: HeroSlideContent; alt: string }) {
  const [desktopError, setDesktopError] = useState(false)
  const [mobileError, setMobileError] = useState(false)
  const { desktop, mobile, objectPosition } = resolveFullImageSources(slide)
  const href = resolveFullImageHref(slide)
  const desktopSrc = desktopError ? "" : desktop
  const mobileSrc = mobileError ? desktopSrc : mobile
  const hasImage = Boolean(desktopSrc || mobileSrc)

  const inner = (
    <div className="relative w-full overflow-hidden aspect-5/4 md:aspect-21/8">
      {hasImage ? (
        <>
          {mobileSrc ? (
            <Image
              src={mobileSrc}
              alt={alt}
              fill
              priority
              className="object-cover md:hidden"
              style={{ objectPosition }}
              sizes="100vw"
              onError={() => setMobileError(true)}
            />
          ) : null}
          {desktopSrc ? (
            <Image
              src={desktopSrc}
              alt={alt}
              fill
              priority
              className={`object-cover ${mobileSrc ? "hidden md:block" : "block"}`}
              style={{ objectPosition }}
              sizes="100vw"
              onError={() => setDesktopError(true)}
            />
          ) : null}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-brand-navy/10 text-sm text-brand-muted">
          Hero görseli yüklenemedi
        </div>
      )}
    </div>
  )

  const wrapped = href ? (
    slide.imageOnlyOpenInNewTab ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full">
        {inner}
      </a>
    ) : (
      <Link href={href} className="block w-full">
        {inner}
      </Link>
    )
  ) : (
    inner
  )

  return wrapped
}

function defaultSlide(): HeroSlideContent {
  return {
    id: 0,
    heroStyle: "split",
    ...HERO_DEFAULTS,
    imageUrl: "",
    mobileImageUrl: null,
    imageObjectPosition: "center",
    linkUrl: null,
    imageOnlyLink: null,
    imageOnlyOpenInNewTab: false,
  }
}

export function HeroSection({ slides = [] }: { slides?: HeroSlideContent[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const heroSlides = slides.length > 0 ? slides : [defaultSlide()]
  const total = heroSlides.length
  const active = heroSlides[currentIndex] ?? heroSlides[0]!
  const style = effectiveHeroStyle(active)

  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total)
    }, 7000)
    return () => clearInterval(timer)
  }, [total])

  const go = (direction: "next" | "prev") => {
    if (total <= 1) return
    setCurrentIndex((prev) =>
      direction === "next" ? (prev + 1) % total : (prev - 1 + total) % total
    )
  }

  if (style === "full_image") {
    return (
      <section className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-border md:rounded-3xl">
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-full-${active.id}-${currentIndex}`}
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <FullImageHeroVisual slide={active} alt={active.title || "Hero banner"} />
            </motion.div>
          </AnimatePresence>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go("prev")}
                aria-label="Önceki slayt"
                className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-brand-navy shadow-lg transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
              >
                <FaArrowLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => go("next")}
                aria-label="Sonraki slayt"
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-brand-navy shadow-lg transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
              >
                <FaArrowRight className="h-3 w-3" />
              </button>
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {heroSlides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Slayt ${i + 1}`}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl md:rounded-3xl"
      style={{ background: "var(--brand-gradient)" }}
    >
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 md:grid-cols-2 md:items-center md:gap-8 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="relative z-10 text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-text-${active.id}-${currentIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {active.badgeText && (
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-blue-light">
                  {active.badgeText}
                </span>
              )}

              <h1 className="mt-4 text-[26px] font-bold leading-tight tracking-tight md:text-[36px] lg:text-[40px]">
                {active.title}
              </h1>

              {active.subtitle && (
                <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-white/85 md:text-[15px]">
                  {active.subtitle}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {active.buttonText && active.buttonLink && (
                  <Link
                    href={active.buttonLink}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-[13px] font-semibold text-brand-navy transition-all duration-200 hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {active.buttonText}
                  </Link>
                )}
                {active.button2Text && active.button2Link && (
                  <Link
                    href={active.button2Link}
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    {active.button2Text}
                  </Link>
                )}
              </div>

              {active.features.length > 0 && (
                <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {active.features.map((label, i) => {
                    const Icon = FEATURE_ICONS[i] ?? FaCheckCircle
                    return (
                      <li
                        key={`${label}-${i}`}
                        className="flex items-center gap-2 text-[11px] font-medium text-white/90 md:text-xs"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-blue" aria-hidden />
                        {label}
                      </li>
                    )
                  })}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`hero-visual-${active.id}-${currentIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <HeroVisual slide={active} alt={active.title} />
              </motion.div>
            </AnimatePresence>

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go("prev")}
                  aria-label="Önceki slayt"
                  className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                >
                  <FaArrowLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => go("next")}
                  aria-label="Sonraki slayt"
                  className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                >
                  <FaArrowRight className="h-3 w-3" />
                </button>
                <div className="mt-3 flex justify-center gap-2">
                  {heroSlides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`Slayt ${i + 1}`}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                        i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
