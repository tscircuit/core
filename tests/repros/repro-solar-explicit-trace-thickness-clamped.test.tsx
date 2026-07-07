import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Wlcsp9 = ({
  name,
  pcbX,
  pcbY,
}: { name: string; pcbX: number; pcbY: number }) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    pinLabels={{
      pin1: ["A1"],
      pin2: ["B1"],
      pin3: ["C1"],
      pin4: ["A2"],
      pin5: ["B2"],
      pin6: ["C2"],
      pin7: ["A3"],
      pin8: ["B3"],
      pin9: ["C3"],
    }}
    footprint={
      <footprint>
        <smtpad
          portHints={["A1"]}
          pcbX="0.4mm"
          pcbY="0.4mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["B1"]}
          pcbX="0mm"
          pcbY="0.4mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["C1"]}
          pcbX="-0.4mm"
          pcbY="0.4mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["A2"]}
          pcbX="0.4mm"
          pcbY="0mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["B2"]}
          pcbX="0mm"
          pcbY="0mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["C2"]}
          pcbX="-0.4mm"
          pcbY="0mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["A3"]}
          pcbX="0.4mm"
          pcbY="-0.4mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["B3"]}
          pcbX="0mm"
          pcbY="-0.4mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
        <smtpad
          portHints={["C3"]}
          pcbX="-0.4mm"
          pcbY="-0.4mm"
          width="0.25mm"
          height="0.25mm"
          shape="rect"
        />
      </footprint>
    }
  />
)

test("repro: explicit trace thickness is not clamped to board minTraceWidth", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="12mm"
      height="8mm"
      autorouterVersion="v4"
      minTraceWidth="0.15mm"
    >
      <Wlcsp9 name="IC1" pcbX={-3} pcbY={1} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} pcbY={1} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-1}
      />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={3} pcbY={-1} />
      <trace
        name="NARROW_TRACE"
        from="IC1.B2"
        to=".R2 > .pin1"
        width="0.06mm"
      />
      <trace name="DEFAULT_TRACE" from=".R3 > .pin1" to=".R4 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({
    name: "NARROW_TRACE",
  })
  expect(sourceTrace?.min_trace_thickness).toBe(0.06)

  const narrowPcbTrace = circuit.db.pcb_trace.getWhere({
    source_trace_id: sourceTrace!.source_trace_id,
  })
  expect(narrowPcbTrace).toBeTruthy()

  const narrowRouteWidths = narrowPcbTrace!.route
    .filter((point) => point.route_type === "wire")
    .map((point) => point.width)

  expect(narrowRouteWidths.length).toBeGreaterThan(0)
  expect(Math.max(...narrowRouteWidths)).toBeLessThanOrEqual(0.06)

  const defaultSourceTrace = circuit.db.source_trace.getWhere({
    name: "DEFAULT_TRACE",
  })
  expect(defaultSourceTrace?.min_trace_thickness).toBeUndefined()

  const defaultPcbTrace = circuit.db.pcb_trace.getWhere({
    source_trace_id: defaultSourceTrace!.source_trace_id,
  })
  expect(defaultPcbTrace).toBeTruthy()

  const defaultRouteWidths = defaultPcbTrace!.route
    .filter((point) => point.route_type === "wire")
    .map((point) => point.width)

  expect(defaultRouteWidths.length).toBeGreaterThan(0)
  expect(Math.max(...defaultRouteWidths)).toBe(0.15)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
