import { expect, test } from "bun:test"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

function InternalResistor({
  resistance,
  lcsc,
  ...props
}: { resistance?: string; lcsc?: any } & any = {}) {
  return (
    <group {...props}>
      <resistor
        name="R1"
        footprint="0402"
        resistance={resistance ?? "-1"}
        supplierPartNumbers={{
          lcsc: lcsc ? [lcsc] : ["-1"],
        }}
        pcbX="8"
        pcbY="8"
      />
      <chip
        name="U1"
        footprint={
          <footprint>
            <platedhole
              name="MP1"
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="2mm"
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="0"
            />
            <platedhole
              name="MP2"
              portHints={["pin2"]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="2mm"
              pcbX="3mm"
              pcbY="0"
            />
          </footprint>
        }
      />
      <trace
        from=".R1 > .pin1"
        to=".U1 > .pin1"
        pcbPath={["R1.pin1", "U1.pin1"]}
        width="0.8mm"
      />
      <trace from=".R1 > .pin2" to=".U1 > .pin2" width="0.8mm" />
    </group>
  )
}
function ExternalResistor({
  resistance,
  lcsc,
  ...props
}: { resistance?: string; lcsc?: any } & any = {}) {
  return (
    <group {...props}>
      <resistor
        name="R1"
        footprint="kicad:Resistor_SMD.pretty/R_0402_1005Metric"
        resistance={resistance ?? "-1"}
        supplierPartNumbers={{
          lcsc: lcsc ? [lcsc] : ["-1"],
        }}
        pcbX="8"
        pcbY="8"
      />
      <chip
        name="U1"
        footprint={
          <footprint>
            <platedhole
              name="MP1"
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="2mm"
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="0"
            />
            <platedhole
              name="MP2"
              portHints={["pin2"]}
              shape="circle"
              holeDiameter="1mm"
              outerDiameter="2mm"
              pcbX="3mm"
              pcbY="0"
            />
          </footprint>
        }
      />
      <trace
        from=".R1 > .pin1"
        to=".U1 > .pin1"
        pcbPath={["R1.pin1", "U1.pin1"]}
        width="0.8mm"
      />
      <trace from=".R1 > .pin2" to=".U1 > .pin2" width="0.8mm" />
    </group>
  )
}

test("autorouting rejects endpoints outside each panel board", async () => {
  const { url: footprintServerUrl } = getTestFootprintServer(
    external0402Footprint,
  )
  const { circuit } = getTestFixture({
    platform: {
      placementDrcChecksDisabled: true,
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          const url = `${footprintServerUrl}/${footprintName}.circuit.json`
          const res = await fetch(url)
          return { footprintCircuitJson: await res.json() }
        },
      },
    },
  })

  const boardWidth = 10 // mm
  const boardHeight = 4 // mm

  const numBoardsX = 2 // number of boards in X direction
  const numBoardsY = 2 // number of boards in Y direction

  const boards = []
  for (let y = 0; y < numBoardsY; y++) {
    for (let x = 0; x < numBoardsX; x++) {
      boards.push({
        pcbX: x * boardWidth,
        pcbY: y * boardHeight,
      })
    }
  }

  circuit.add(
    <panel width={40} height={40} boardGap={8} layoutMode="grid">
      {boards.map((pos, i) => (
        <board key={i} width={`${boardWidth}mm`} height={`${boardHeight}mm`}>
          {i % 2 === 0 ? <ExternalResistor /> : <InternalResistor />}
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()

  // R1 is at (8, 8), outside its 10 x 4 mm board. Expanding the routing
  // bounds to include it must not expand the physical board. Only the four
  // explicit pcbPath traces remain; the four autorouted paths are rejected.
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(4)
  const manualTraces = circuit.db.pcb_trace.list()
  expect(manualTraces).toHaveLength(4)
  for (const trace of manualTraces) {
    expect(circuit.db.pcb_trace_error.list()).toContainEqual(
      expect.objectContaining({
        pcb_trace_id: trace.pcb_trace_id,
        message: expect.stringContaining("outside the board boundaries"),
      }),
    )
  }
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
