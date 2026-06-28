import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createVariantCombinationKey,
  generateVariantCombinations,
  mergeVariantCombinationsWithExisting,
} from "../../lib/variantCombinations"
import { normalizeVariantAttributes } from "../../lib/variantAttributes"
import {
  effectiveHeroStyle,
  HERO_FALLBACK_IMAGE,
  normalizeHeroSlide,
  parseHeroObjectPosition,
  parseHeroStyle,
  resolveFullImageHref,
  resolveFullImageSources,
  validateHeroForm,
} from "../../lib/heroContent"

describe("variant combination helpers", () => {
  it("generateVariantCombinations produces sorted combinationKey", () => {
    const { combinations, limitExceeded } = generateVariantCombinations([
      {
        attributeId: 2,
        attributeName: "Renk",
        attributeType: "COLOR",
        values: [{ valueId: 20, value: "Gold" }],
      },
      {
        attributeId: 1,
        attributeName: "Uzunluk",
        attributeType: "SELECT",
        values: [
          { valueId: 10, value: "40 cm" },
          { valueId: 11, value: "45 cm" },
        ],
      },
    ])
    assert.equal(limitExceeded, false)
    assert.equal(combinations.length, 2)
    assert.equal(combinations[0]!.combinationKey, "1:10|2:20")
    assert.equal(combinations[0]!.label, "Gold / 40 cm")
  })

  it("createVariantCombinationKey matches generateCombinationKey order", () => {
    const key = createVariantCombinationKey([
      { attributeId: 5, valueId: 50 },
      { attributeId: 3, valueId: 30 },
    ])
    assert.equal(key, "3:30|5:50")
  })

  it("mergeVariantCombinationsWithExisting preserves existing variant data", () => {
    const generated = generateVariantCombinations([
      {
        attributeId: 1,
        attributeName: "Renk",
        attributeType: "COLOR",
        values: [
          { valueId: 1, value: "Gold" },
          { valueId: 2, value: "Silver" },
        ],
      },
    ]).combinations

    const merged = mergeVariantCombinationsWithExisting(
      generated,
      [
        {
          id: 99,
          combinationKey: generated[0]!.combinationKey,
          sku: "KEEP-SKU",
          price: "199.99",
          stock: 7,
        },
      ],
      "0",
      "TST"
    )

    const gold = merged.find((m) => m.name === "Gold")
    assert.ok(gold)
    assert.equal(gold!.id, 99)
    assert.equal(gold!.sku, "KEEP-SKU")
    assert.equal(gold!.isNew, false)
    assert.ok(merged.some((m) => m.isNew && m.name === "Silver"))
  })

  it("normalizeVariantAttributes prefers relational over JSON", () => {
    const map = normalizeVariantAttributes(
      [
        {
          attribute: { id: 1, name: "Renk", slug: "renk", type: "COLOR" },
          value: { id: 10, value: "Gold", slug: "gold", colorHex: "#C9A84C" },
        },
      ],
      '{"Renk":"Silver"}'
    )
    assert.equal(map.renk?.value, "Gold")
    assert.equal(map.renk?.colorHex, "#C9A84C")
  })
})

describe("hero content helpers", () => {
  it("validateHeroForm rejects invalid links and requires image for full_image", () => {
    assert.match(
      validateHeroForm({ heroStyle: "full_image", imageUrl: "" }) ?? "",
      /görsel zorunlu/i
    )
    assert.match(
      validateHeroForm({ heroStyle: "split", imageUrl: "/hero.jpg", buttonLink: "ftp://bad" }) ?? "",
      /Link alanları/i
    )
    assert.equal(
      validateHeroForm({
        heroStyle: "split",
        imageUrl: "/hero.jpg",
        buttonLink: "/search",
        imageOnlyLink: "https://example.com",
      }),
      null
    )
  })

  it("effectiveHeroStyle falls back to split without image", () => {
    assert.equal(
      effectiveHeroStyle({
        id: 1,
        heroStyle: "full_image",
        badgeText: "",
        title: "",
        subtitle: "",
        buttonText: "",
        buttonLink: "",
        button2Text: "",
        button2Link: "",
        features: [],
        imageUrl: "",
        mobileImageUrl: null,
        imageObjectPosition: "center",
        linkUrl: null,
        imageOnlyLink: null,
        imageOnlyOpenInNewTab: false,
      }),
      "split"
    )
  })

  it("resolveFullImageSources uses mobile fallback and object position", () => {
    const slide = normalizeHeroSlide({
      id: 1,
      heroStyle: "full_image",
      imageUrl: "/desktop.jpg",
      mobileImageUrl: "/mobile.jpg",
      imageObjectPosition: "top",
    })
    const sources = resolveFullImageSources(slide)
    assert.equal(sources.desktop, "/desktop.jpg")
    assert.equal(sources.mobile, "/mobile.jpg")
    assert.equal(sources.objectPosition, "top")
    assert.equal(parseHeroObjectPosition("unknown"), "center")
    assert.equal(parseHeroStyle("full_image"), "full_image")
  })

  it("resolveFullImageHref prefers imageOnlyLink", () => {
    const slide = normalizeHeroSlide({
      id: 2,
      heroStyle: "full_image",
      imageUrl: "/x.jpg",
      linkUrl: "/internal",
      imageOnlyLink: "https://external.example",
      imageOnlyOpenInNewTab: true,
    })
    assert.equal(resolveFullImageHref(slide), "https://external.example")
    assert.equal(
      resolveFullImageSources({
        ...slide,
        imageUrl: "",
      }).desktop,
      HERO_FALLBACK_IMAGE
    )
  })
})
