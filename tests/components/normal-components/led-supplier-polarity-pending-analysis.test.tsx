import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unresolved supplier polarity keeps layout pending until its data arrives", async () => {
  const supplierCircuitJson =
    Promise.withResolvers<ReturnType<typeof createSupplierLedCircuitJson>>()
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: ({ sourceComponent }) =>
          "ftype" in sourceComponent && sourceComponent.ftype === "simple_led"
            ? { jlcpcb: ["C3030991"] }
            : {},
        fetchPartCircuitJson: () => supplierCircuitJson.promise,
      },
    },
  })
  circuit.add(
    <board width={12} height={8}>
      <resistor name="R1" resistance="330" footprint="0603" pcbX={-3} />
      <led name="D1" footprint="0603" color="red" pcbX={3} />
      <trace from="R1.pin2" to="D1.anode" />
      <trace from="R1.pin1" to="D1.cathode" />
    </board>,
  )
  const rendering = circuit.renderUntilSettled()
  try {
    // Exceed the former 2s cutoff without resolving the supplier request.
    await new Promise((resolve) => setTimeout(resolve, 2300))
    expect(circuit.isDoneRendering()).toBe(false)
    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    expect(circuit.getRunningAsyncEffects()).toContainEqual(
      expect.objectContaining({ effectName: "resolve-led-supplier-polarity" }),
    )
  } finally {
    supplierCircuitJson.resolve(createSupplierLedCircuitJson("cathode"))
    await rendering
  }

  const led = circuit.selectOne(".D1") as Led
  expect(led.cathode.props.pinNumber).toBe(1)
  expect(led.anode.props.pinNumber).toBe(2)
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(0)
  const sourcePorts = circuit.db.source_port.list({
    source_component_id: led.source_component_id!,
  })
  expect(
    sourcePorts.find((port) => port.port_hints?.includes("cathode"))
      ?.pin_number,
  ).toBe(1)
  expect(
    sourcePorts.find((port) => port.port_hints?.includes("anode"))?.pin_number,
  ).toBe(2)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 10_000)
