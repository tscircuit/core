import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated pill smtpad emits a rotated_pill solder paste", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        pcbRotation={30}
        footprint={
          <footprint>
            <smtpad
              shape="pill"
              width="1mm"
              height="0.6mm"
              radius="0.3mm"
              portHints={["1"]}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pad = circuit.db.pcb_smtpad.list()[0]! as any
  expect(pad.shape).toBe("rotated_pill")
  const pastes = circuit.db.pcb_solder_paste.list()
  expect(pastes.length).toBe(1)
  const paste = pastes[0]! as any
  expect(paste.shape).toBe("rotated_pill")
  expect(paste.width).toBeCloseTo(0.7, 6)
  expect(paste.height).toBeCloseTo(0.42, 6)
  expect(paste.radius).toBeCloseTo(0.21, 6)
  expect(paste.ccw_rotation).toBeCloseTo(pad.ccw_rotation, 6)
  expect(paste.x).toBeCloseTo(pad.x, 6)
  expect(paste.y).toBeCloseTo(pad.y, 6)
})
