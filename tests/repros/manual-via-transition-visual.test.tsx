import { expect, test } from "bun:test"
import { createPcbLayerStackSvg } from "tests/fixtures/create-pcb-layer-stack-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("snapshot disconnected manual via transitions on each PCB layer", async () => {
  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  circuit.add(
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPath={[
          "R1.pin2",
          { x: 3, y: 0 },
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "bottom",
            toLayer: "inner2",
          },
          { x: 3, y: 0 },
          { x: 5, y: 0 },
          {
            x: 5,
            y: 0,
            via: true,
            fromLayer: "inner2",
            toLayer: "top",
          },
          { x: 5, y: 0 },
          "R2.pin1",
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={5}
        fontSize={0.6}
        text="PASS: disconnected via contact is reported"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Invalid: top trace enters a bottom-to-inner2 via"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pcbTrace = circuit.db.pcb_trace.list()[0]!
  const invalidVia = circuit.db.pcb_via.list()[0]!
  expect(circuit.db.pcb_trace_error.list()).toEqual([
    expect.objectContaining({
      pcb_trace_id: pcbTrace.pcb_trace_id,
      source_trace_id: pcbTrace.source_trace_id,
      center: { x: invalidVia.x, y: invalidVia.y },
      is_fatal: false,
      message: expect.stringMatching(
        /^Invalid pcbPath \(R1\.pin2 to R2\.pin1\): via 1.*bottom → inner2.*incoming top copper\.$/,
      ),
    }),
    // Routing DRC independently reports the same disconnected transition.
    expect.objectContaining({
      pcb_trace_id: pcbTrace.pcb_trace_id,
      source_trace_id: pcbTrace.source_trace_id,
      message: expect.stringMatching(
        /^Via in trace \[R1\.pin2 to R2\.pin1\] does not connect its adjacent wire layers/,
      ),
    }),
  ])

  const layerStackSvg = createPcbLayerStackSvg(circuit.getCircuitJson())
  await expect(layerStackSvg).toMatchSvgSnapshot(
    import.meta.path,
    "manual-via-transition-layers",
    { diffThresholdPercent: 0 },
  )
})
