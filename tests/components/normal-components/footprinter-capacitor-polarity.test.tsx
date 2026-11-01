import { expect, test } from "bun:test"
import { Capacitor } from "lib/components/normal-components/Capacitor"
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
  for (const [name, footprint, expected, polarized] of [
    ["C_POS1", "cap0805", "cap0805_polarized", true],
    [
      "C_POS2",
      "cap0805_positivepin2_negativepin1",
      "cap0805_positivepin2_negativepin1_polarized",
      true,
    ],
    ["C_CERAMIC", "0805", "cap0805_nonpolarized", false],
  ] as const) {
    const capacitor = circuit.selectOne(`.${name}`) as Capacitor
    expect(capacitor.props.footprint).toBe(footprint)
    expect(capacitor._parsedProps.footprint).toBe(footprint)
    expect(capacitor.resolveFootprint()).toBe(expected)
    expect(capacitor.getFootprinterString()).toBe(expected)
    const normalized = new Capacitor({
      name: "C_NORMALIZED",
      capacitance: "10uF",
      footprint: expected,
      polarized,
    })
    expect(normalized.resolveFootprint()).toBe(expected)
    expect(normalized.getFootprinterString()).toBe(expected)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
