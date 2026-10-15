import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render returns a TSX pad that joins the component's port, placed relative to the component", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="10mm">
      <chip
        name="U1"
        pcbX={3}
        pcbY={1}
        footprint={
          <footprint>
            <platedhole
              shape="circle"
              holeDiameter={0.8}
              outerDiameter={1.3}
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
            />
            <pcbpostroutingstep
              render={() => (
                <smtpad
                  shape="circle"
                  radius={0.3}
                  portHints={["1"]}
                  pcbX={0.9}
                  pcbY={0}
                  layer="top"
                />
              )}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const cj = circuit.getCircuitJson()
  const hole = cj.find((e) => e.type === "pcb_plated_hole") as any
  const pads = cj.filter((e) => e.type === "pcb_smtpad") as any[]
  expect(pads).toHaveLength(1)
  expect(pads[0].pcb_port_id).toBe(hole.pcb_port_id)
  expect(pads[0].pcb_component_id).toBe(hole.pcb_component_id)
  expect([pads[0].x, pads[0].y]).toEqual([3.9, 1])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
