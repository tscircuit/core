import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getSchematicObstaclesForTrace } from "lib/components/primitive-components/Trace/get-obstacles-for-trace"
import { getSvgFromGraphicsObject } from "graphics-debug"
import type { Trace } from "lib/components"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"

test("trace schematic obstacles", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip name="U1" footprint="soic16" />
      <resistor name="R1" schX={5} resistance={100} footprint="0402" />
      <trace from=".U1 > .pin9" to=".R1 > .pin1" />
      <trace from=".U1 > .pin7" to=".R1 > .pin2" />
      <trace from=".U1 > .pin2" to="net.GND" />
    </board>,
  )

  circuit.render()

  const trace = circuit.selectOne("trace")

  const schematicObstacles = getSchematicObstaclesForTrace(trace as Trace)

  expect(
    getSvgFromGraphicsObject({
      rects: schematicObstacles,
    }),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "schematic-trace-obstacles-1-obstacles",
  )
  expect(
    convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "schematic-trace-obstacles-1-schematic",
  )
})
