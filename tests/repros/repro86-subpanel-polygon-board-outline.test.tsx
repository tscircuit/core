import { expect, test } from "bun:test"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

test("subpanel manual placement with polygon boards outlines", async () => {
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

  const numBoardsX = 4
  const numBoardsY = 4

  const boards = []
  for (let y = 0; y < numBoardsY; y++) {
    for (let x = 0; x < numBoardsX; x++) {
      boards.push({
        pcbX: x * 8 + 2 * x,
        pcbY: y * 4 + 2 * y,
      })
    }
  }

  circuit.add(
    <panel
      width={100}
      height={100}
      panelizationMethod="tab-routing"
      layoutMode="none"
    >
      {boards.map((pos, i) => (
        <subpanel pcbX={pos.pcbX - 50 + 3 + 2} pcbY={pos.pcbY - 50 + 1 + 2}>
          <board
            key={`${pos.pcbX}-${pos.pcbY}`}
            outline={[
              { x: -3, y: 1 },
              { x: 3, y: 1 },
              { x: 3, y: -1 },
              { x: -3, y: -1 },
            ]}
          >
            <resistor
              name="R1"
              footprint="kicad:Resistor_SMD/R_0603_1608Metric"
              resistance="1k"
              pcbX={2}
              pcbY={0}
            />
            <resistor
              name="R2"
              footprint={"0402"}
              resistance={"1k"}
              pcbX={-2}
              connections={{
                pin1: ".R1 > .pin1",
              }}
            />
          </board>
        </subpanel>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  // Drillable 0.5 mm mouse bites on these 2 mm boards come within 0.17 mm of
  // R1-R2 traces, so the trace clearance check now reports each conflict.
  const errors = circuitJson.filter((elm) => elm.type.includes("error"))
  expect(errors).toHaveLength(32)
  expect([
    ...new Set(errors.map((error) => error.type)),
    ...new Set(circuit.db.pcb_trace_error.list().map((error) => error.message)),
  ]).toMatchInlineSnapshot(`
    [
      "pcb_trace_error",
      "Trace .R2 > .pin1 to .R1 > .pin1 is too close to non-plated hole unnamed hole (gap: 0.165746mm, required: 0.2mm)",
    ]
  `)

  expect(circuitJson).toMatchPcbSnapshot(import.meta.path)
})
