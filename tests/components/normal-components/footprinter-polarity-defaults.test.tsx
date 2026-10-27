import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit footprint polarity and cathode-first package defaults produce unambiguous ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={12} routingDisabled>
      <diode name="D_K1" footprint="sod323he" pcbX={-10} />
      <diode name="D_K1_DO" footprint="do219ad" pcbX={-3} />
      <led name="LED_A2" footprint="led0805_anodepin2_cathodepin1" pcbX={5} />
      <capacitor
        name="C_POS2"
        capacitance="10uF"
        polarized
        footprint="cap0805_positivepin2_negativepin1"
        pcbX={11}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const source of circuit.db.source_component.list()) {
    const ports = circuit.db.source_port.list({
      source_component_id: source.source_component_id,
    })
    const positives = ports.filter((port) => port.port_hints?.includes("pos"))
    const negatives = ports.filter((port) => port.port_hints?.includes("neg"))
    expect(positives).toHaveLength(1)
    expect(negatives).toHaveLength(1)
    expect(positives[0]!.pin_number).toBe(2)
    expect(negatives[0]!.pin_number).toBe(1)
    expect(positives[0]!.port_hints).not.toContain("neg")
    expect(negatives[0]!.port_hints).not.toContain("pos")
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
