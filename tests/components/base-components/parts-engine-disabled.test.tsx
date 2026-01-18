import { it, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import type { PartsEngine } from "@tscircuit/props"

it("should not have supplier part numbers when parts engine is disabled", async () => {
  const customPartsEngine: PartsEngine = {
    findPart: (elm: any) => {
      return {
        "0402": ["123-456"],
      }
    },
  } as any
  const circuit = new RootCircuit({
    platform: {
      partsEngineDisabled: true,
      partsEngine: customPartsEngine,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourceComponent = circuitJson.find((e) => e.type === "source_component")
  console.log(sourceComponent)
  expect(sourceComponent?.supplier_part_numbers).toBeUndefined()
})
