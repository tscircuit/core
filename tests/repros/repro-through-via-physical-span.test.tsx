import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("parent routing must avoid the physical span of child plane escape vias", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="16mm"
      height="12mm"
      layers={4}
      autorouter="beta_pipeline9"
      minTraceWidth="0.15mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaPadDiameter="0.6mm"
      minViaHoleDiameter="0.3mm"
    >
      <group name="CHILD" subcircuit pcbWidth="9mm" pcbHeight="8mm">
        <copperpour layer="inner2" connectsTo="net.VCC" unbroken />
        <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
        <trace from="U1.pin2" to="net.VCC" />
        <trace from="U1.pin3" to="net.VCC" />
      </group>

      <resistor
        name="R_LEFT"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={-6}
        pcbY={0.635}
      />
      <resistor
        name="R_RIGHT"
        resistance="1k"
        footprint="0402"
        layer="bottom"
        pcbX={6}
        pcbY={0.635}
      />
      <trace name="BOTTOM_SIGNAL" from="R_LEFT.pin1" to="R_RIGHT.pin2" />

      <pcbnotetext
        pcbY={5}
        fontSize="0.45mm"
        text="CHILD: TOP TO INNER2 ESCAPE; PHYSICAL VIA IS THROUGH"
      />
      <pcbnotetext
        pcbY={-5}
        fontSize="0.45mm"
        text="PARENT BOTTOM SIGNAL MUST AVOID EVERY THROUGH VIA"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const routingErrors = await runAllRoutingChecks(circuitJson)

  expect(phases).toHaveLength(2)
  const parentInput = phases[1]!.startSimpleRouteJson!
  expect(parentInput.allowBlindAndBuriedVias).toBe(false)
  const planeVias = circuit.db.pcb_via
    .list()
    .filter((via) => via.from_layer === "top" && via.to_layer === "inner2")
  expect(planeVias.length).toBeGreaterThan(0)
  for (const via of planeVias) {
    const parentViaObstacle = parentInput.obstacles.find(
      (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id === via.pcb_via_id,
    )!
    expect(parentViaObstacle.layers).toEqual([
      "top",
      "inner1",
      "inner2",
      "bottom",
    ])
  }

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    showSolderMask: false,
    shouldDrawErrors: false,
    showErrorsInTextOverlay: true,
  })
  await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "through-via-physical-span-phases",
    circuit,
  )
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(routingErrors).toEqual([])
}, 30_000)
