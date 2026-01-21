import { expect, test } from "bun:test"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getTestFootprintServer } from "tests/fixtures/get-test-footprint-server"

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

  const boardWidth = 6
  const boardHeight = 2

  const numBoardsX = 4
  const numBoardsY = 4

  const boards = []
  for (let y = 0; y < numBoardsY; y++) {
    for (let x = 0; x < numBoardsX; x++) {
      boards.push({
        pcbX: x * boardWidth + 2 * x,
        pcbY: y * boardHeight + 2 * y,
      })
    }
  }

  circuit.add(
    <panel width={100} height={100} panelizationMethod="tab-routing">
      {boards.map((pos, i) => (
        <board
          width={boardWidth}
          height={boardHeight}
          key={`${pos.pcbX}-${pos.pcbY}`}
          pcbX={pos.pcbX - 50 + 3 + 2}
          pcbY={pos.pcbY - 50 + 1 + 2}
        >
          <resistor
            name="R1"
            footprint="kicad:Resistor_SMD/R_0603_1608Metric"
            resistance="1k"
            pcbX={0}
            pcbY={0}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})

test("repro kicad footprints in panel with polygon boards", async () => {
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
    <panel width={100} height={100} panelizationMethod="tab-routing">
      {boards.map((pos, i) => (
        <board
          key={`${pos.pcbX}-${pos.pcbY}`}
          pcbX={pos.pcbX - 50 + 3 + 2}
          pcbY={pos.pcbY - 50 + 1 + 2}
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
            pcbX={0}
            pcbY={0}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(
    `${import.meta.path}-polygon-boards`,
  )
})
