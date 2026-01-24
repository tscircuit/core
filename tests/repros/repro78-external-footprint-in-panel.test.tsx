import { expect, test } from "bun:test"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

function ResistorComponent({
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
        pcbX="0"
        pcbY="0"
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

test("repro kicad footprints in panel", async () => {
  const { url: footprintServerUrl } = getTestFootprintServer(
    external0402Footprint,
  )
  const { circuit } = getTestFixture({
    platform: {
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
    <panel width={30} height={30} layoutMode="grid">
      {boards.map((pos, i) => (
        <board key={i} width={`${boardWidth}mm`} height={`${boardHeight}mm`}>
          <ResistorComponent pcbX={0} pcbY={0} />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const errors = circuitJson.filter((element) => element.type.includes("error"))

  expect(errors.length).toBe(0)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
