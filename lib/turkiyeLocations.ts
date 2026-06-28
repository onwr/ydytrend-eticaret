import ilExport from "./il.json"
import ilceExport from "./ilce.json"

export type TurkeyLocation = {
  id: number
  name: string
}

type IlRow = { id: string; name: string }
type IlceRow = { id: string; il_id: string; name: string }

type PhpMyAdminTable<T> = {
  type: "table"
  name: string
  data: T[]
}

function extractTableData<T>(exportData: unknown[], tableName: string): T[] {
  const table = exportData.find(
    (item): item is PhpMyAdminTable<T> =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "table" &&
      "name" in item &&
      item.name === tableName &&
      "data" in item &&
      Array.isArray(item.data)
  )
  return table?.data ?? []
}

function formatPlaceName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ")
}

const provinces = extractTableData<IlRow>(ilExport as unknown[], "il")
  .map((row) => ({
    id: Number(row.id),
    name: formatPlaceName(row.name),
  }))
  .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.id <= 81)
  .sort((a, b) => a.name.localeCompare(b.name, "tr"))

const districtsByProvinceId = new Map<number, TurkeyLocation[]>()

for (const row of extractTableData<IlceRow>(ilceExport as unknown[], "ilce")) {
  const provinceId = Number(row.il_id)
  const id = Number(row.id)
  if (!Number.isFinite(provinceId) || !Number.isFinite(id)) continue

  const list = districtsByProvinceId.get(provinceId) ?? []
  list.push({ id, name: formatPlaceName(row.name) })
  districtsByProvinceId.set(provinceId, list)
}

for (const list of districtsByProvinceId.values()) {
  list.sort((a, b) => a.name.localeCompare(b.name, "tr"))
}

export function getTurkeyProvinces(): TurkeyLocation[] {
  return provinces
}

export function getTurkeyDistricts(provinceId: number): TurkeyLocation[] {
  return districtsByProvinceId.get(provinceId) ?? []
}
