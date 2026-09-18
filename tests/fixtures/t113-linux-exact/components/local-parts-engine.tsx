import type { PartsEngine, SupplierPartNumbers } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import capacitor100nF from "./C1525.circuit.json"
import supervisor from "./C19653.circuit.json"
import resistor100k from "./C25741.circuit.json"
import resistor1k5 from "./C25867.circuit.json"
import capacitor470nF from "./C47339.circuit.json"
import capacitor1uF from "./C52923.circuit.json"
import capacitor22pF from "./C70464.circuit.json"
import crystal24M from "./C70571.circuit.json"
import capacitor4u7F from "./C98195.circuit.json"
import capacitor2u2F from "./C107369.circuit.json"
import resistor10k from "./C190095.circuit.json"
import capacitor10uF from "./C408142.circuit.json"
import resistor31k6 from "./C705766.circuit.json"
import resistor33k2 from "./C705767.circuit.json"
import resistor49k9 from "./C705780.circuit.json"
import resistor240 from "./C2909339.circuit.json"
import inductor1u5 from "./C3033018.circuit.json"
import ldo18 from "./C3744783.circuit.json"
import t113SupplierCircuitJson from "./t113-supplier.circuit.json"

// Genuine C5197687 library geometry downloaded through tsci import on 2026-09-11
// and rendered locally. It retains the supplier orientation for comparison.
// Add further exact supplier downloads to the extraFootprints argument.
export const T113_SUPPLIER_CACHE: Record<string, AnyCircuitElement[]> = {
  C5197687: t113SupplierCircuitJson as unknown as AnyCircuitElement[],
}

export function createLocalPartsEngine(
  extraFootprints: Record<string, AnyCircuitElement[]> = {},
  selectedParts: Record<string, SupplierPartNumbers> = {},
): PartsEngine {
  const footprints = { ...T113_SUPPLIER_CACHE, ...extraFootprints }

  return {
    findPart({ sourceComponent }) {
      if (sourceComponent.type !== "source_component") {
        throw new Error(
          `Cannot select a supplier part for ${sourceComponent.type}`,
        )
      }
      const explicit = sourceComponent.supplier_part_numbers
      if (explicit && Object.values(explicit).some((parts) => parts?.length)) {
        return explicit
      }
      const partKey =
        sourceComponent.manufacturer_part_number ?? sourceComponent.name
      const selected = selectedParts[partKey]
      if (selected && Object.values(selected).some((parts) => parts?.length)) {
        return selected
      }
      throw new Error(
        `No locally selected supplier part for ${sourceComponent.name} (${partKey}). Specify a verified supplierPartNumbers value or add a selectedParts entry.`,
      )
    },

    fetchPartCircuitJson({ supplierPartNumber, manufacturerPartNumber }) {
      const partNumber = supplierPartNumber?.trim().toUpperCase()
      if (!partNumber || !footprints[partNumber]) {
        throw new Error(
          `No downloaded supplier footprint for ${partNumber ?? manufacturerPartNumber ?? "unknown part"}. Import that part's exact library geometry and add it to the local cache.`,
        )
      }
      // The core receives a fresh copy, so it cannot change the cached reference.
      return JSON.parse(
        JSON.stringify(footprints[partNumber]),
      ) as AnyCircuitElement[]
    },
  }
}

export const localPartsEngine = createLocalPartsEngine({
  C19653: supervisor as unknown as AnyCircuitElement[],
  C705766: resistor31k6 as unknown as AnyCircuitElement[],
  C190095: resistor10k as unknown as AnyCircuitElement[],
  C25741: resistor100k as unknown as AnyCircuitElement[],

  C3744783: ldo18 as unknown as AnyCircuitElement[],
  C408142: capacitor10uF as unknown as AnyCircuitElement[],
  C98195: capacitor4u7F as unknown as AnyCircuitElement[],
  C25867: resistor1k5 as unknown as AnyCircuitElement[],

  C2909339: resistor240 as unknown as AnyCircuitElement[],
  C70571: crystal24M as unknown as AnyCircuitElement[],
  C70464: capacitor22pF as unknown as AnyCircuitElement[],
  C47339: capacitor470nF as unknown as AnyCircuitElement[],
  C52923: capacitor1uF as unknown as AnyCircuitElement[],
  C1525: capacitor100nF as unknown as AnyCircuitElement[],
  C107369: capacitor2u2F as unknown as AnyCircuitElement[],
  C3033018: inductor1u5 as unknown as AnyCircuitElement[],
  C705780: resistor49k9 as unknown as AnyCircuitElement[],
  C705767: resistor33k2 as unknown as AnyCircuitElement[],
})
