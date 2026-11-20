import { expect, test } from "bun:test"
import type { PcbCopperPourBRep } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unbroken copperpour inside a rotated group transforms its autorouter obstacle and pour outline", async () => {
  const { circuit } = getTestFixture()
  let capturedSrj: SimpleRouteJson | undefined

  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    capturedSrj = structuredClone(simpleRouteJson)
  })

  circuit.add(
    <board width="18mm" height="14mm">
      <net name="GND" />

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={3} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />

      <group name="GND_ISLAND" pcbX={0} pcbY={0} pcbRotation={90}>
        <resistor
          name="R_GND"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={0}
          connections={{ pin1: "net.GND" }}
        />
        <copperpour
          connectsTo="net.GND"
          layer="top"
          unbroken
          clearance="0.2mm"
          boardEdgeMargin="0.15mm"
          outline={[
            { x: 1.5, y: -1.4 },
            { x: 4.5, y: -1.4 },
            { x: 4.5, y: 1.4 },
            { x: 1.5, y: 1.4 },
          ]}
        />
      </group>

      <pcbnotetext
        text="90 deg group moves unbroken GND pour to x=[-1.4,1.4], y=[1.5,4.5]; R1-R2 detours around it"
        pcbX={0}
        pcbY={-5.5}
        fontSize="0.42mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  const copperPourObstacles = (capturedSrj?.obstacles ?? []).filter(
    (obstacle) => obstacle.isCopperPour,
  )
  expect(copperPourObstacles.length).toBeGreaterThan(0)
  for (const obstacle of copperPourObstacles) {
    expect(Math.abs(obstacle.center.x)).toBeLessThan(0.01)
    expect(obstacle.center.y).toBeGreaterThanOrEqual(1.5)
    expect(obstacle.center.y).toBeLessThanOrEqual(4.5)
  }

  const copperPours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour): pour is PcbCopperPourBRep => pour.shape === "brep")
  expect(copperPours).toHaveLength(1)

  const vertices = copperPours[0]!.brep_shape.outer_ring.vertices
  expect(Math.min(...vertices.map((vertex) => vertex.x))).toBeCloseTo(-1.25, 1)
  expect(Math.max(...vertices.map((vertex) => vertex.x))).toBeCloseTo(1.25, 1)
  expect(Math.min(...vertices.map((vertex) => vertex.y))).toBeCloseTo(1.65, 1)
  expect(Math.max(...vertices.map((vertex) => vertex.y))).toBeCloseTo(4.35, 1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
