import { modelFor } from "./jlc-adapters"
import { jlcById } from "./jlc-registry"
// Explicit approved selections: never infer a voltage rating from package size.
export const resistorIds: Record<string, string> = {
  "3k": "C4211",
  "240": "C23350",
  "33": "C23140",
  "22": "C23345",
  "1M": "C22935",
  "10k": "C25804",
  "100k": "C25803",
  "4.7k": "C23162",
  "100": "C22775",
  "1k": "C21190",
  "169k": "C3013192",
  "15k": "C177614",
  "8m": "C5154825",
  "10": "C22859",
  "93.1k": "C23266",
  "27.4k": "C165753",
  "4.12k": "C23041",
  "1.5k": "C22843",
  "2.61k": "C22942",
  "9.31k": "C137666",
  "330": "C17930",
  "53.6k": "C137700",
  "200k": "C25811",
  "29.4k": "C137752",
  "5.1k": "C23186",
  "470": "C23179",
  "140k": "C22875",
  "750": "C23241",
  "12k": "C22790",
}
export const capacitorSelections: Record<
  string,
  { id: string; voltage: number }
> = {
  "2.2uF": { id: "C57895", voltage: 25 },
  "100nF": { id: "C14663", voltage: 50 },
  "1uF": { id: "C559769", voltage: 50 },
  "1nF": { id: "C106246", voltage: 50 },
  "10uF": { id: "C13585", voltage: 50 },
  "4.7uF": { id: "C1705", voltage: 10 },
  "100uF": { id: "C7588440", voltage: 10 },
  "47pF": { id: "C149616", voltage: 50 },
  "220pF": { id: "C519500", voltage: 50 },
  "560pF": { id: "C107094", voltage: 50 },
  "33nF": { id: "C106856", voltage: 50 },
  "3.3nF": { id: "C107048", voltage: 50 },
  "33pF": { id: "C107047", voltage: 50 },
  "18pF": { id: "C107040", voltage: 50 },
  "10nF": { id: "C100042", voltage: 50 },
  "47nF": { id: "C107093", voltage: 50 },
}
const part = (id: string) => {
  const p = jlcById[id]
  if (!p) throw new Error(`Required JLCPCB import missing: ${id}`)
  return p
}
const number = (v: string) => {
  const m = v.replace(/ohms?|[ΩF\s]/g, "").match(/^([\d.]+)([pkmnuM]?)$/)
  if (!m) throw new Error(`Cannot check component value: ${v}`)
  return (
    +m[1] *
    { p: 1e-12, n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, M: 1e6, "": 1 }[m[2]]!
  )
}
function checked(
  id: string,
  value: string,
  field: "resistance" | "capacitance",
) {
  const imported = modelFor(part(id).manufacturerPartNumber)
  const p = id === "C5154825" ? { ...imported, resistance: "8m" } : imported
  if (Math.abs(number(p[field]) - number(value)) > number(value) * 1e-9)
    throw new Error(`Imported ${id} ${p[field]} does not match ${value}`)
  return p
}
export function resistorModel(value: string, packageHint: string) {
  const id =
    value === "1k" && packageHint === "1206"
      ? "C4410"
      : (resistorIds[value] ??
        Object.entries(resistorIds).find(
          ([v]) => number(v) === number(value),
        )?.[1])
  if (!id) throw new Error(`No resistor selection for ${value}`)
  return checked(id, value, "resistance")
}
export function capacitorModel(value: string, netName: string) {
  const highVoltage = /^(VIN20|PD_RAW|M[1-4]_(REG|VBUS))$/.test(netName)
  const s =
    value === "47uF"
      ? {
          id: highVoltage ? "C264034" : "C338051",
          voltage: highVoltage ? 35 : 16,
        }
      : value === "22uF"
        ? {
            id: highVoltage ? "C342620" : "C105212",
            voltage: highVoltage ? 35 : 16,
          }
        : capacitorSelections[value]
  if (!s) throw new Error(`No capacitor selection for ${value}`)
  if (highVoltage && s.voltage < 35)
    throw new Error(`${s.id} is underrated for ${netName}`)
  return {
    ...checked(s.id, value, "capacitance"),
    maxVoltageRating: `${s.voltage}V`,
  }
}
