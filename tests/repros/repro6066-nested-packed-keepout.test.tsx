import { beforeAll, expect, test } from "bun:test"
import type { PcbComponent } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const keepoutOffsetY = 3
let r2: PcbComponent

beforeAll(async () => {
  circuit.add(
    <board width={30} height={18} pcbPack pcbPackGap={2} routingDisabled>
      <group name="Anchor">
        <resistor name="R1" resistance="1k" footprint="1206" />
      </group>
      <group name="Packed">
        <group name="Inner" pcbX={0} pcbY={0}>
          <resistor
            name="R2"
            resistance="1k"
            footprint="1206"
            pcbX={0}
            pcbY={0}
          />
          <keepout
            shape="rect"
            pcbY={keepoutOffsetY}
            width={4}
            height={2}
            allowPlacements
            allowTraces
          />
        </group>
      </group>
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        text="HATCHED KEEPOUT SHOULD BE 3 MM ABOVE R2"
        pcbY={7}
        fontSize={0.9}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_keepout.list()).toHaveLength(1)
  const [keepout] = circuit.db.pcb_keepout.list()
  const r2Source = circuit.db.source_component.getWhere({ name: "R2" })!
  r2 = circuit.db.pcb_component.getWhere({
    source_component_id: r2Source.source_component_id,
  })!
  expect(r2.pcb_group_id).toBeDefined()
  expect(keepout.pcb_group_id).toBe(r2.pcb_group_id)
  expect(r2.center).not.toEqual({ x: 0, y: 0 })
  expect(r2.rotation).toBe(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing("packing preserves the keepout's offset from R2", () => {
  const [keepout] = circuit.db.pcb_keepout.list()
  expect(keepout).toMatchObject({
    center: { x: r2.center.x, y: r2.center.y + keepoutOffsetY },
  })
})
