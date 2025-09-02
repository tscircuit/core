import { it, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

it("selects all descendant normal components", () => {
  const project = new RootCircuit()
  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <group name="G1">
        <led name="L1" footprint="0402" />
      </group>
    </board>,
  )

  project.render()

  const board = project.firstChild!
  const normals = board.selectAll("normalcomponent")
  expect(normals.map((c) => c.props.name).sort()).toEqual(["G1", "L1", "R1"])
})
