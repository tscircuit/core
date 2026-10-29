import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"
import { AssemblyPart } from "lib/components/primitive-components/AssemblyPart"

class DelayedCadPart extends AssemblyPart {
  release!: () => void

  doInitialCadModelRender(): void {
    this._queueAsyncEffect("delayed-cad", async () => {
      await new Promise<void>((resolve) => {
        this.release = resolve
      })
      super.doInitialCadModelRender()
    })
  }
}

test("explosion phases wait for CAD effects anywhere in the assembly tree", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="D">
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="PART" offZ={8} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  const part = new DelayedCadPart({
    name: "PART",
    cadModel: { jscad: { type: "cube", size: 4 } },
  })
  circuit.children[0].add(part)
  circuit.render()
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  expect(circuit.db.cad_explosion_stage.list()).toHaveLength(0)
  expect(circuit.db.cad_explosion_move.list()).toHaveLength(0)
  part.release()
  await circuit.renderUntilSettled()
  const cad = circuit.db.cad_component.list()[0]
  expect(circuit.db.cad_explosion_stage.list()[0].cad_component_ids).toEqual([
    cad.cad_component_id,
  ])
  expect(circuit.db.cad_explosion_move.list()[0]).toMatchObject({
    targets: [
      { type: "cad_component", cad_component_id: cad.cad_component_id },
    ],
    translation: { x: 0, y: 0, z: 8 },
  })
})
