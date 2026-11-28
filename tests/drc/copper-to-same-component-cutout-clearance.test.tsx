import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("copper to same-component cutout clearance does not trigger false placement error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="30mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.6mm"
              height="1.2mm"
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
            />
            {/* Cutout placed 0.171mm away from pad edge (pad top edge at y=0.6, cutout bottom edge at y=0.771) */}
            {/* Cutout height=1mm, center.y = 0.771 + 0.5 = 1.271 */}
            <cutout
              shape="rect"
              width="1mm"
              height="1mm"
              pcbX={0}
              pcbY={1.271}
            />
          </footprint>
        }
      />
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={5} pcbY={0} />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const placementErrors = circuit.db.pcb_placement_error.list()
  expect(placementErrors).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
})

test("copper to different-component cutout clearance STILL triggers placement error", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="30mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="0.6mm"
              height="1.2mm"
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      {/* Cutout belongs to board or another component, placed 0.171mm away from U1 pad */}
      <cutout shape="rect" width="1mm" height="1mm" pcbX={0} pcbY={1.271} />
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={5} pcbY={0} />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const placementErrors = circuit.db.pcb_placement_error.list()
  expect(placementErrors.length).toBeGreaterThan(0)
  expect(placementErrors.some((err) => (err as any).pcb_cutout_id)).toBe(true)
})
