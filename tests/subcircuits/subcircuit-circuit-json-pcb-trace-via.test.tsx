import { expect, test } from "bun:test"
import type { CircuitJson, PcbTrace, PcbVia } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit circuitJson inflation preserves pcb_via properties for routed trace vias", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board
      width="12mm"
      height="8mm"
      pcbStyle={{ viaHoleDiameter: 0.45, viaPadDiameter: 0.9 }}
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX="-3mm"
        pcbY="0mm"
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX="3mm"
        pcbY="0mm"
      />
      <trace
        from=".R1 > .pin1"
        to=".R2 > .pin1"
        pcbPath={[
          { x: 0, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
        ]}
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  const sourceJson = sourceCircuit.getCircuitJson()
  const sourceVia = sourceJson.find((elm) => elm.type === "pcb_via") as PcbVia
  expect(sourceVia).toBeDefined()
  expect(sourceVia.hole_diameter).toBe(0.45)
  expect(sourceVia.outer_diameter).toBe(0.9)

  const circuitJsonWithRouteViaDiameters = sourceJson.filter(
    (elm) => elm.type !== "pcb_via",
  ) as CircuitJson
  const sourcePcbTrace = circuitJsonWithRouteViaDiameters.find(
    (elm): elm is PcbTrace => elm.type === "pcb_trace",
  )
  expect(sourcePcbTrace).toBeDefined()
  for (const routePoint of sourcePcbTrace!.route) {
    if (routePoint.route_type !== "via") continue
    ;(routePoint as any).hole_diameter = sourceVia.hole_diameter
    ;(routePoint as any).outer_diameter = sourceVia.outer_diameter
  }

  const { circuit: targetCircuit } = getTestFixture()
  targetCircuit.add(
    <board width="20mm" height="20mm">
      <subcircuit
        name="Inflated"
        circuitJson={circuitJsonWithRouteViaDiameters}
      />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  const targetJson = targetCircuit.getCircuitJson()
  const targetVias = targetJson.filter(
    (elm) => elm.type === "pcb_via",
  ) as PcbVia[]

  expect(targetVias).toHaveLength(1)
  expect(targetVias[0].hole_diameter).toBe(0.45)
  expect(targetVias[0].outer_diameter).toBe(0.9)
  expect(targetVias[0].from_layer).toBe("top")
  expect(targetVias[0].to_layer).toBe("bottom")
  expect(targetVias[0].pcb_trace_id).toBeDefined()
})
