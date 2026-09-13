import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual trace vias inherit the board tenting through nested subcircuits", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} defaultViaTenting="bottom_tented">
      <pcbnotetext
        text="Manual route | Bottom tented"
        pcbY={3}
        fontSize={0.5}
      />
      <subcircuit name="Nested">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <trace
          from=".R1 > .pin1"
          to=".R2 > .pin1"
          pcbPath={[
            { x: 0, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
          ]}
        />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_via.list()).toMatchObject([
    {
      tented_on_top: false,
      tented_on_bottom: true,
      pcb_trace_id: expect.any(String),
    },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    layer: "bottom",
  })
})
