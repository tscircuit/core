import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"

test("failed imported assets report incomplete coverage using readable part names", async () => {
  let requests = 0
  const server = Bun.serve({
    port: 0,
    fetch() {
      requests++
      return new Response("missing", { status: 404 })
    },
  })
  try {
    const circuit = new Circuit({
      platform: { projectBaseUrl: server.url.href },
    })
    circuit.add(
      <assembly.device name="LOAD_FAILURE">
        <assembly.part
          name="MISSING_BOLT"
          cadModel={{ objUrl: "/missing.obj" }}
        />
        <assembly.explosion.stage name="lift">
          <assembly.explosion.move targetRef="MISSING_BOLT" offZ={5} />
        </assembly.explosion.stage>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    expect(requests).toBe(1)
    expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe(
      "incomplete",
    )
    expect(circuit.db.cad_explosion_collision_error.list()).toEqual([])
    const warnings = circuit.db.cad_explosion_collision_check_warning.list()
    expect(warnings).toHaveLength(1)
    expect(warnings[0].reason).toBe("invalid_geometry")
    expect(warnings[0].message).toContain('"MISSING_BOLT"')
    expect(warnings[0].message).not.toContain("cad_component_")
  } finally {
    server.stop(true)
  }
})
