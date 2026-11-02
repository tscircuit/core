import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"
import { AssemblyPart } from "lib/components/primitive-components/AssemblyPart"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"

class DelayedCollisionObstacle extends AssemblyPart {
  release!: () => void

  doInitialCadModelRender() {
    this._queueAsyncEffect("delayed-obstacle", async () => {
      await new Promise<void>((resolve) => {
        this.release = resolve
      })
      super.doInitialCadModelRender()
    })
  }
}

test("collision checks wait for async CAD and discard diagnostics for superseded moves", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="ASYNC">
      <assembly.part
        name="MOVER"
        cadModel={{ jscad: { type: "cube", size: 2 } }}
      />
      <assembly.explosion.stage name="slide">
        <assembly.explosion.move targetRef="MOVER" offX={10} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  const obstacle = new DelayedCollisionObstacle({
    name: "LATE",
    cadModel: {
      jscad: { type: "cube", size: 2 },
      positionOffset: { x: 5, y: 0, z: 0 },
    },
  })
  circuit.children[0].add(obstacle)
  circuit.render()
  expect(
    circuit.firstChild!.renderPhaseStates.CadExplosionCollisionCheck
      .initialized,
  ).toBe(false)
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  obstacle.release()
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(1)
  const move = circuit.selectOne(".slide")!.children[0] as AssemblyExplosionMove
  move.setProps({ ...move.props, offX: 12 })
  circuit.render()
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("pending")
  move.setProps({ ...move.props, offX: -10 })
  circuit.render()
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
})
