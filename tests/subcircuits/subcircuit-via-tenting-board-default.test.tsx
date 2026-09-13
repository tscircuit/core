import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("imported routed vias preserve explicit sides and inherit only unspecified sides", async () => {
  const { circuit: source } = getTestFixture()
  source.add(
    <board width={12} height={8}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace
        from="R1.pin1"
        to="R2.pin1"
        pcbPath={[
          { x: 0, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        ]}
      />
    </board>,
  )
  await source.renderUntilSettled()
  expect(source.db.pcb_via.list()).toHaveLength(1)

  for (const [flags, top, bottom] of [
    [{}, true, false],
    [{ tented_on_top: false }, false, false],
    [{ tented_on_bottom: true }, true, true],
    [{ tented_on_top: false, tented_on_bottom: true }, false, true],
    [{ is_tented: false }, false, false],
    [{ is_tented: true, tented_on_bottom: false }, true, false],
  ] as const) {
    const circuitJson = source
      .getCircuitJson()
      .map((element) =>
        element.type === "pcb_via" ? { ...element, ...flags } : element,
      )
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={20} height={20} defaultViaTenting="top_tented">
        <subcircuit name="Imported" circuitJson={circuitJson} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(1)
    expect([vias[0].tented_on_top, vias[0].tented_on_bottom]).toEqual([
      top,
      bottom,
    ])
    expect(vias[0]).not.toHaveProperty("is_tented")
    expect(vias[0].hole_diameter).toBe(
      source.db.pcb_via.list()[0].hole_diameter,
    )
  }
})
