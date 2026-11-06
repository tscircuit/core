import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual pcbPath crossing a cutout produces a routing DRC error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={6} layers={4} schematicDisabled>
      <pinheader name="J1" pinCount={1} pcbX={-3} />
      <pinheader name="J2" pinCount={1} pcbX={3} />
      <cutout name="USB_POST_SLOT" shape="rect" width={1.51} height={0.71} />
      <trace
        name="VM_TO_ADC_DIVIDER"
        from=".J1 > .pin1"
        to=".J2 > .pin1"
        thickness={0.56}
        pcbPathRelativeTo="board"
        pcbPath={[{ x: 0, y: 0 }]}
      />
      <pcbnotetext
        text="Manual copper crosses milled slot: DRC must report it"
        pcbY={2}
        fontSize={0.25}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  // A visual record is generated before the intentionally failing assertion.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const trace = circuit.db.pcb_trace.list()[0]
  const wires = trace.route.filter((point) => point.route_type === "wire")
  expect(wires.every((point) => point.y === 0)).toBe(true)
  expect(Math.min(...wires.map((point) => point.x))).toBeLessThan(-0.755)
  expect(Math.max(...wires.map((point) => point.x))).toBeGreaterThan(0.755)
  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.endsWith("_error"))
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringMatching(/cutout|slot/i),
      }),
    ]),
  )
})
