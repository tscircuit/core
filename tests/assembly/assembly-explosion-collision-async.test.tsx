import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"
import { AssemblyPart } from "lib/components/primitive-components/AssemblyPart"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

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
  const colliding = structuredClone(circuit.getCircuitJson())
  const move = circuit.selectOne(".slide")!.children[0] as AssemblyExplosionMove
  move.setProps({ ...move.props, offX: 12 })
  circuit.render()
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("pending")
  move.setProps({ ...move.props, offX: -10 })
  circuit.render()
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(0)
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
  await expectAssemblySnapshot(import.meta.path, {
    title: "Collision render phase: await CAD and discard stale checks",
    panels: [
      {
        title: "1. Late obstacle is included",
        circuit: colliding,
        code: "await circuit.renderUntilSettled()\n// LATE has now emitted CAD\n// slide offX={10}: one collision",
        annotation:
          "The check waits for geometry even when it is emitted after the explosion stage.",
        renderOptions: {
          camPos: [-17, 14, 22],
          poppygl: { lookAt: [-3, 0, 0] },
          gltf: { explosion: { stageProgress: 0.5 } },
        },
      },
      {
        title: "2. New path replaces pending results",
        circuit: circuit.getCircuitJson(),
        code: "move.setProps({ offX: 12, ... })\ncircuit.render()\nmove.setProps({ offX: -10, ... })\nawait circuit.renderUntilSettled()",
        annotation:
          "Only the final leftward path is committed; the pending rightward collision is discarded.",
        renderOptions: {
          camPos: [-17, 14, 22],
          poppygl: { lookAt: [0, 0, 0] },
          gltf: { explosion: {} },
        },
      },
    ],
  })
})
