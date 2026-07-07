import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CenterPadChip = () => (
  <chip
    name="IC1"
    pcbX={-2}
    pcbY={0}
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

test("repro: center pad explicit trace width is preserved", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="8mm"
      height="4mm"
      autorouterVersion="v4"
      minTraceWidth="0.15mm"
    >
      <CenterPadChip />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={2} pcbY={0} />
      <trace
        name="CENTER_PAD_TRACE"
        from="IC1.B2"
        to=".R1 > .pin1"
        width="0.06mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({
    name: "CENTER_PAD_TRACE",
  })
  expect(sourceTrace?.min_trace_thickness).toBe(0.06)

  const pcbTrace = circuit.db.pcb_trace.getWhere({
    source_trace_id: sourceTrace!.source_trace_id,
  })
  expect(pcbTrace).toBeTruthy()

  const wireWidths = pcbTrace!.route
    .filter((point) => point.route_type === "wire")
    .map((point) => point.width)

  expect(wireWidths.length).toBeGreaterThan(0)
  expect(Math.max(...wireWidths)).toBeLessThanOrEqual(0.06)
})
