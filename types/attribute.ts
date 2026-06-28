export type AttributeSummary = {
  id: number
  name: string
  slug: string
  type: string
}

export type CategoryAttributeLink = {
  attributeId: number
  isVariant: boolean
  isFilterable: boolean
  isRequired: boolean
  attribute: AttributeSummary
}
