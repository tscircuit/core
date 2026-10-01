import { expect, test } from "bun:test"
import { Resistor } from "lib/components/normal-components/Resistor"
import { Board } from "lib/components/normal-components/Board/Board"
import type { ReactElement } from "react"
import { createLoadingCircuit } from "./loading-fixture"

test("legacy subclass supplier and React-subtree overrides remain observable through native adapters", async () => {
  class CustomResistor extends Resistor {
    supplierCalls = 0
    subtreeCalls = 0
    protected override async _getSupplierPartNumbers() {
      this.supplierCalls++
      return { jlcpcb: ["custom"] }
    }
    override _renderReactSubtree(element: ReactElement) {
      this.subtreeCalls++
      return super._renderReactSubtree(element)
    }
  }
  const circuit = createLoadingCircuit({
    partsEngine: {
      findPart: () => {
        throw new Error("base provider should be bypassed")
      },
    },
  })
  const board = new Board({ width: 10, height: 10 })
  const resistor = new CustomResistor({
    name: "R1",
    resistance: "10k",
    footprint: "0402",
  })
  resistor.add(<silkscreentext text="custom adapter" />)
  board.add(resistor)
  circuit.add(board)
  await circuit.renderUntilSettled()
  expect(resistor.subtreeCalls).toBe(1)
  expect(resistor.supplierCalls).toBe(1)
  expect(
    circuit.db.source_component.get(resistor.source_component_id!)
      ?.supplier_part_numbers,
  ).toEqual({ jlcpcb: ["custom"] })
  expect(circuit.db.source_part_not_found_warning.list()).toHaveLength(0)
  await circuit.dispose()
})
