import { expect, test } from "bun:test"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createSupplierLedCircuitJson } from "tests/fixtures/create-supplier-led-circuit-json"

test("adopting supplier polarity preserves generated port props and parsed props", async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngine: {
        findPart: () => ({ jlcpcb: ["C3030991"] }),
        fetchPartCircuitJson: () => createSupplierLedCircuitJson("cathode"),
      },
    },
  })
  circuit.add(
    <board width={12} height={8}>
      <led name="D1" footprint="0603" color="red" />
    </board>,
  )
  const led = circuit.selectOne(".D1") as Led
  const originalPorts = led._getAllPortsFromChildren().map((port) => ({
    port,
    props: structuredClone(port.props),
    parsedProps: structuredClone(port._parsedProps),
  }))
  await circuit.renderUntilSettled()
  for (const { port, props, parsedProps } of originalPorts) {
    expect(port.props).toEqual(props)
    expect(port._parsedProps).toEqual(parsedProps)
  }
  expect(led.cathode.props.pinNumber).toBe(1)
  expect(led.anode.props.pinNumber).toBe(2)
  expect(circuit.db.source_component_misconfigured_error.list()).toHaveLength(0)
})
