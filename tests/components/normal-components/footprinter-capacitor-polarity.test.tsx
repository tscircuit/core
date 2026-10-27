import { expect, test } from "bun:test"
import { resolveFootprinterPolarity } from "lib/components/base-components/NormalComponent/utils/resolve-footprinter-polarity"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polarized capacitor footprint options agree with its electrical ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={12} routingDisabled>
      <capacitor
        name="C_POS1"
        capacitance="10uF"
        polarized
        footprint="cap0805"
        pcbX={-7}
      />
      <capacitor
        name="C_POS2"
        capacitance="10uF"
        polarized
        footprint="cap0805_positivepin2_negativepin1"
        pcbX={0}
      />
      <capacitor
        name="C_CERAMIC"
        capacitance="100nF"
        footprint="0805"
        pcbX={7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const swapped = circuit.db.source_component
    .list()
    .find((component) => component.name === "C_POS2")!
  const positive = circuit.db.source_port
    .list({ source_component_id: swapped.source_component_id })
    .find((port) => port.port_hints?.includes("pos"))!
  expect(positive.pin_number).toBe(2)
  expect(
    resolveFootprinterPolarity({
      footprint: "0805",
      componentName: "Capacitor",
      name: "C1",
      polarized: true,
    }).footprint,
  ).toBe("cap0805_positivepin1_negativepin2")
  expect(
    resolveFootprinterPolarity({
      footprint: "0805",
      componentName: "Capacitor",
      name: "C1",
      polarized: false,
    }).footprint,
  ).toBe("0805")
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
