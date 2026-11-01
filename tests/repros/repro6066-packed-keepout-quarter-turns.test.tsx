import { expect, test } from "bun:test"
import {
  type PackOutput,
  convertCircuitJsonToPackOutput,
} from "calculate-packing"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { applyPackOutput } from "lib/components/primitive-components/Group/Group_doInitialPcbLayoutPack/applyPackOutput"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectangular group and footprint keepouts rotate with packed pads", async () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270] as const
  circuit.add(
    <board width="46mm" height="16mm" routingDisabled schematicDisabled>
      <pcbnotetext
        text="PACK OUTPUT: 0 / 90 / 180 / 270"
        pcbY={6}
        fontSize={0.6}
      />
      <keepout shape="rect" width="2mm" height="1mm" pcbX={20} pcbY={-5} />
      {rotations.map((angle) => (
        <group key={angle} name={`G${angle}`}>
          <chip
            name={`U${angle}`}
            footprint={
              <footprint>
                <smtpad shape="rect" width={6} height={3} portHints={["1"]} />
                <smtpad
                  shape="rect"
                  width={3}
                  height={1}
                  pcbX={1}
                  pcbY={0.5}
                  portHints={["2"]}
                />
                <keepout
                  shape="rect"
                  width={3}
                  height={1}
                  pcbX={1}
                  pcbY={0.5}
                  allowPlacements
                  allowTraces
                />
              </footprint>
            }
          />
          <keepout
            shape="rect"
            width={6}
            height={3}
            allowPlacements
            allowTraces
          />
        </group>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Group
  const initial = convertCircuitJsonToPackOutput(circuit.db.toArray(), {
    source_group_id: board.source_group_id!,
  })
  const groups = rotations.map(
    (angle) => circuit.db.pcb_group.getWhere({ name: `G${angle}` })!,
  )
  const output: PackOutput = {
    ...initial,
    components: groups.map((group, index) => {
      const initialComponent = initial.components.find(
        (component) => component.componentId === group.source_group_id,
      )!
      expect(initialComponent).toBeDefined()
      return {
        ...initialComponent,
        center: { x: -15 + index * 10, y: 0 },
        ccwRotationOffset: rotations[index],
        ccwRotationDegrees: rotations[index],
      }
    }),
  }
  applyPackOutput(board, output, {}, initial)

  for (const [index, angle] of rotations.entries()) {
    const group = groups[index]
    const source = circuit.db.source_component.getWhere({ name: `U${angle}` })!
    const component = circuit.db.pcb_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const pads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.pcb_component_id === component.pcb_component_id)
    const pad1 = pads.find((pad) => pad.port_hints?.includes("1"))!
    const pad2 = pads.find((pad) => pad.port_hints?.includes("2"))!
    const groupKeepout = circuit.db.pcb_keepout
      .list()
      .find(
        (keepout) =>
          keepout.pcb_group_id === group.pcb_group_id &&
          !keepout.pcb_component_id,
      )!
    const footprintKeepout = circuit.db.pcb_keepout
      .list()
      .find(
        (keepout) => keepout.pcb_component_id === component.pcb_component_id,
      )!
    expect(footprintKeepout.pcb_group_id).toBe(group.pcb_group_id)
    if (
      pad1.shape !== "rect" ||
      pad2.shape !== "rect" ||
      groupKeepout.shape !== "rect" ||
      footprintKeepout.shape !== "rect"
    )
      throw new Error("Expected rectangular pads and keepouts")
    for (const [keepout, pad] of [
      [groupKeepout, pad1],
      [footprintKeepout, pad2],
    ] as const) {
      expect(keepout.center.x).toBeCloseTo(pad.x, 5)
      expect(keepout.center.y).toBeCloseTo(pad.y, 5)
      expect(keepout.width).toBeCloseTo(pad.width, 5)
      expect(keepout.height).toBeCloseTo(pad.height, 5)
    }
  }
  const boardKeepout = circuit.db.pcb_keepout
    .list()
    .find((keepout) => keepout.shape === "rect" && keepout.center.x === 20)!
  if (boardKeepout.shape !== "rect")
    throw new Error("Expected rectangular board keepout")
  expect(boardKeepout.center).toEqual({ x: 20, y: -5 })
  expect([boardKeepout.width, boardKeepout.height]).toEqual([2, 1])
  await expect(circuit.db.toArray()).toMatchPcbSnapshot(import.meta.path)
})
