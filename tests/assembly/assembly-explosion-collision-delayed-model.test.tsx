import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import { loadRp2040ExplosionFixture } from "./fixtures/rp2040-explosion/load-fixture"

test("superseded collision checks cannot commit after a slow real OBJ download finishes", async () => {
  const fixture = await loadRp2040ExplosionFixture()
  const source = fixture.find(
    (r) => r.type === "source_component" && r.name === "bolt1",
  )!
  if (source.type !== "source_component") throw Error("Missing bolt source")
  const cad = fixture.find(
    (r) =>
      r.type === "cad_component" &&
      r.source_component_id === source.source_component_id,
  )!
  if (cad.type !== "cad_component") throw Error("Missing bolt model")
  const obj = await (await fetch(cad.model_obj_url!)).text()
  let started!: () => void, release!: () => void
  const requested = new Promise<void>((resolve) => {
    started = resolve
  })
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  const server = Bun.serve({
    port: 0,
    async fetch() {
      started()
      await pending
      return new Response(obj)
    },
  })
  try {
    const circuit = new Circuit()
    circuit.add(
      <assembly.device name="ASYNC_MODELS">
        <assembly.part
          name="BOLT"
          cadModel={{ objUrl: new URL("/bolt.obj", server.url).href }}
        />
        <assembly.part
          name="OTHER"
          cadModel={{
            objUrl: cad.model_obj_url!,
            positionOffset: { x: 10, y: 0, z: 0 },
          }}
        />
        <assembly.explosion.stage name="slide">
          <assembly.explosion.move targetRef="BOLT" offX={20} />
        </assembly.explosion.stage>
      </assembly.device>,
    )
    circuit.render()
    await requested
    expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("pending")
    const move = circuit.selectOne(".slide")!
      .children[0] as AssemblyExplosionMove
    move.setProps({ ...move.props, offX: -20 })
    circuit.render()
    release()
    await circuit.renderUntilSettled()
    expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
    expect(circuit.db.cad_explosion_collision_error.list()).toEqual([])
    expect(circuit.db.cad_explosion_collision_check_warning.list()).toEqual([])
  } finally {
    release()
    server.stop(true)
  }
})
