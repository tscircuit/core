import type { SupplierPartNumbers } from "@tscircuit/props"
import { expect, test } from "bun:test"
import { Board } from "lib/components/normal-components/Board/Board"
import { Resistor } from "lib/components/normal-components/Resistor"
import {
  createLoadingRevisionCircuit,
  disposeLoadingRevisionCircuit,
  reportLoadingRevisionObservation,
} from "./loading-fixtures"

test("S2 plain supplier overrides publish during render without async supplier events", async () => {
  const supplierPartNumbers: SupplierPartNumbers = { jlcpcb: ["C25804"] }
  const events: string[] = []
  let overrideCalls = 0
  let providerCalls = 0
  const circuit = createLoadingRevisionCircuit({
    partsEngine: {
      findPart: () => {
        providerCalls++
        return { jlcpcb: ["unexpected-base-path"] }
      },
    },
  })
  const resistor = new Resistor({
    name: "R1",
    resistance: "10k",
    footprint: "0402",
  })
  // Dynamic JavaScript extensions historically return a plain value here.
  // The baseline render phase explicitly branches on instanceof Promise even
  // though the protected TypeScript signature describes a Promise facade.
  Object.defineProperty(resistor, "_getSupplierPartNumbers", {
    value: () => {
      overrideCalls++
      events.push("supplier_override")
      return supplierPartNumbers
    },
  })
  circuit.on("asyncEffect:start", (event: { effectName: string }) => {
    if (event.effectName === "get-supplier-part-numbers")
      events.push("supplier_start")
  })
  circuit.on("asyncEffect:end", (event: { effectName: string }) => {
    if (event.effectName === "get-supplier-part-numbers")
      events.push("supplier_end")
  })
  try {
    const board = new Board({ width: 10, height: 10 })
    board.add(resistor)
    circuit.add(board)

    circuit.render()
    events.push("render_returned")
    const immediateJson = structuredClone(circuit.getCircuitJson())
    const immediateSource = immediateJson.find(
      (element) => element.type === "source_component" && element.name === "R1",
    )
    const immediateEvents = [...events]
    const immediateOverrideCalls = overrideCalls

    await circuit.renderUntilSettled()
    events.push("settled")
    const settledJson = circuit.getCircuitJson()
    const settledSource = settledJson.find(
      (element) => element.type === "source_component" && element.name === "R1",
    )
    reportLoadingRevisionObservation("S2", "plain_supplier_override", {
      immediateSource,
      immediateEvents,
      immediateOverrideCalls,
      settledSource,
      events,
      overrideCalls,
      providerCalls,
    })

    expect(
      immediateSource?.type === "source_component" &&
        immediateSource.supplier_part_numbers,
    ).toEqual(supplierPartNumbers)
    expect(immediateEvents).toEqual(["supplier_override", "render_returned"])
    expect(immediateOverrideCalls).toBe(1)
    expect(
      settledSource?.type === "source_component" &&
        settledSource.supplier_part_numbers,
    ).toEqual(supplierPartNumbers)
    expect(events).toEqual(["supplier_override", "render_returned", "settled"])
    expect(overrideCalls).toBe(1)
    expect(providerCalls).toBe(0)
    expect(
      settledJson.filter(
        (element) => element.type === "source_part_not_found_warning",
      ),
    ).toHaveLength(0)
  } finally {
    await disposeLoadingRevisionCircuit(circuit)
  }
})
