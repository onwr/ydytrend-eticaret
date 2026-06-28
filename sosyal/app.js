import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
import { motion } from "https://esm.sh/framer-motion@11.11.17?deps=react@18.3.1,react-dom@18.3.1";

const e = React.createElement;
const MotionA = motion.a;
const MotionHeader = motion.header;
const MotionImg = motion.img;
const MotionNav = motion.nav;
const MotionFooter = motion.footer;
const MotionSection = motion.section;

/** Görseller — sunucuya dosya kopyalamadan CDN / ana siteden */
const ASSETS = {
  logo: "https://mobiltedarik.com/logo.png",
  oriflameQr: "https://i.ibb.co/SwsjKd0b/q.jpg",
};

/** Bağlantıları buradan güncelleyebilirsiniz */
const LINKS = {
  instagram: {
    title: "INSTAGRAM",
    subtitle: "@mobiltedarik",
    href: "https://www.instagram.com/mobiltedarik",
    className:
      "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] hover:brightness-110",
  },
  tiktok: {
    title: "TIKTOK",
    subtitle: "@mobiltedarik",
    href: "https://www.tiktok.com/@mobiltedarik",
    className: "bg-black ring-1 ring-white/10 hover:bg-zinc-900",
  },
  trendyol: {
    title: "TRENDYOL MAĞAZASI",
    subtitle: "M&M Mağazası",
    href: "https://www.trendyol.com/magaza/m-m-1116504",
    className: "bg-[#f27a1a] hover:bg-[#e06d12]",
  },
  hepsiburada: {
    title: "HEPSİBURADA MAĞAZASI",
    subtitle: "Mavi Salon",
    href: "https://www.hepsiburada.com/magaza/mavi-salon?sayfa=2",
    className: "bg-gradient-to-r from-[#4e2a8e] to-[#6b3fa0] hover:brightness-110",
  },
  web: {
    title: "WEB SİTEMİZ",
    subtitle: "mobiltedarik.com",
    href: "https://mobiltedarik.com/",
    className:
      "bg-brand-surface/80 ring-1 ring-brand/40 hover:ring-brand hover:bg-brand-surface",
  },
  whatsapp: {
    title: "WHATSAPP",
    subtitle: "0545 723 58 04",
    href: "https://wa.me/905457235804",
    className: "bg-[#25D366] hover:bg-[#20bd5a]",
  },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function IconInstagram() {
  return e(
    "svg",
    { className: "h-7 w-7 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true },
    e("path", {
      d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    }),
  );
}

function IconTikTok() {
  return e(
    "svg",
    { className: "h-7 w-7 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true },
    e("path", {
      d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
    }),
  );
}

function IconShop() {
  return e(
    "svg",
    {
      className: "h-7 w-7 shrink-0",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      "aria-hidden": true,
    },
    e("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      d: "M3 9l1-4h16l1 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9M9 13h6",
    }),
  );
}

function IconGlobe() {
  return e(
    "svg",
    {
      className: "h-7 w-7 shrink-0",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      "aria-hidden": true,
    },
    e("circle", { cx: 12, cy: 12, r: 9 }),
    e("path", { d: "M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" }),
  );
}

function IconWhatsApp() {
  return e(
    "svg",
    { className: "h-7 w-7 shrink-0", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true },
    e("path", {
      d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.882 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
    }),
  );
}

const BUTTONS = [
  { key: "instagram", icon: IconInstagram },
  { key: "tiktok", icon: IconTikTok },
  { key: "trendyol", icon: IconShop },
  { key: "hepsiburada", icon: IconShop },
  { key: "web", icon: IconGlobe },
  { key: "whatsapp", icon: IconWhatsApp },
];

function OriflameQr() {
  return e(
    MotionSection,
    {
      variants: item,
      className:
        "mt-6 overflow-hidden rounded-2xl bg-[#6ec9d6] p-5 text-center shadow-lg ring-1 ring-white/20",
      "aria-label": "Oriflame mağaza kayıt QR kodu",
    },
    e(
      "p",
      { className: "mb-3 text-xs font-extrabold tracking-widest text-white" },
      "ORIFLAME MAĞAZA KAYDI",
    ),
    e(
      "div",
      { className: "mx-auto max-w-[220px] overflow-hidden rounded-2xl bg-white p-2 shadow-md" },
      e("img", {
        src: ASSETS.oriflameQr,
        alt: "Oriflame mağaza kayıt QR kodu — Beni tara",
        className: "h-auto w-full rounded-xl",
        loading: "lazy",
        decoding: "async",
      }),
    ),
  );
}

function LinkButton({ link, Icon }) {
  return e(
    MotionA,
    {
      href: link.href,
      target: "_blank",
      rel: "noopener noreferrer",
      variants: item,
      whileHover: { scale: 1.02, y: -2 },
      whileTap: { scale: 0.98 },
      className:
        "flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-white shadow-lg transition-shadow " +
        link.className,
    },
    e(
      "span",
      {
        className:
          "flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm",
      },
      e(Icon),
    ),
    e(
      "span",
      { className: "min-w-0 flex-1" },
      e("span", { className: "block text-sm font-extrabold tracking-wide" }, link.title),
      e("span", { className: "block truncate text-xs font-medium text-white/85" }, link.subtitle),
    ),
  );
}

function App() {
  const year = new Date().getFullYear();

  return e(
    "div",
    { className: "relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-8" },
    e(
      "div",
      { className: "pointer-events-none absolute inset-0 -z-10 overflow-hidden", "aria-hidden": true },
      e("div", {
        className:
          "absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl",
      }),
      e("div", {
        className: "absolute bottom-0 right-0 h-48 w-48 rounded-full bg-brand-dark/10 blur-3xl",
      }),
    ),
    e(
      MotionHeader,
      {
        initial: { opacity: 0, y: -16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        className: "mb-8 flex flex-col items-center text-center",
      },
      e(MotionImg, {
        src: ASSETS.logo,
        alt: "Mobil Tedarik",
        className: "mb-4 h-28 w-auto max-w-[220px] object-contain drop-shadow-glow",
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { delay: 0.1, duration: 0.5 },
      }),
      e(
        "p",
        { className: "text-sm font-medium tracking-wide text-brand-muted" },
        "Telefon ve tablet yedek parçalarında güvenilir tedarik",
      ),
    ),
    e(
      MotionNav,
      {
        variants: container,
        initial: "hidden",
        animate: "show",
        className: "flex flex-1 flex-col gap-3",
        "aria-label": "Sosyal medya ve mağaza bağlantıları",
      },
      BUTTONS.map(({ key, icon }) =>
        e(LinkButton, { key, link: LINKS[key], Icon: icon }),
      ),
      e(OriflameQr),
    ),
    e(
      MotionFooter,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.7, duration: 0.4 },
        className: "mt-10 text-center text-[11px] font-medium text-brand-muted",
      },
      "© ",
      year,
      " Mobil Tedarik · Tüm Hakları Saklıdır.",
    ),
  );
}

createRoot(document.getElementById("root")).render(e(App));
