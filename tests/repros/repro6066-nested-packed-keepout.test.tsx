import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const clearance = { pcbY: 3, width: 4, height: 2 }

beforeAll(async () => {
  circuit.add(
    <board width={30} height={18} pcbPack pcbPackGap={2} routingDisabled>
      <group name="Anchor">
        <resistor name="R1" resistance="1k" footprint="1206" />
      </group>
      <group name="Packed">
        <group name="Inner" pcbX={0} pcbY={0}>
          <resistor name="R2" resistance="1k" footprint="1206">
            <pcbnoterect {...clearance} color="#36e4be" />
          </resistor>
          <keepout shape="rect" {...clearance} allowPlacements allowTraces />
        </group>
      </group>
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        text="GREEN SHOULD MATCH HATCHED KEEPOUT"
        pcbY={7}
        fontSize={0.9}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_note_rect.list()).toHaveLength(1)
  expect(circuit.db.pcb_keepout.list()).toHaveLength(1)
  const [expectedClearance] = circuit.db.pcb_note_rect.list()
  expect(expectedClearance.center).not.toEqual({ x: 0, y: clearance.pcbY })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing("a nested group keepout follows its packed ancestor", () => {
  const [expectedClearance] = circuit.db.pcb_note_rect.list()
  const [keepout] = circuit.db.pcb_keepout.list()
  expect(keepout).toMatchObject({ center: expectedClearance.center })
})
