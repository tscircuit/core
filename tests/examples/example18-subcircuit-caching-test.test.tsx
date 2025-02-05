import { grid } from "@tscircuit/math-utils"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const LedColumns = (props: {
  numXLeds?: number
  numYLeds?: number
  pcbX?: number
  pcbY?: number
  autorouter?: any
  name: string
}) => {
  const numXLeds = props.numXLeds ?? 3
  const numYLeds = props.numYLeds ?? 3
  return (
    <subcircuit {...props}>
      {grid({ rows: numYLeds, cols: numXLeds, xSpacing: 8, ySpacing: 4  }).map(({ index, center: { x, y }}) => (
        <>
          <chip key={`LED${index+1}`} footprint="soic4" name={`LED${index+1}`} pcbX={x} pcbY={y} />
          {index > 0 && <trace from={`.LED${index} .pin3`} to={`.LED${index+1} .pin1`} />}
        </>
      ))}
    </subcircuit>
  )
}

test.skip("subcircuit autorouting max traces test", async () => {
  const { circuit } = getTestFixture()
  const totalLEDSubcircuits = 25  // Total number of LED column groups
  const gridSize = Math.ceil(Math.sqrt(totalLEDSubcircuits))  // Calculate grid dimensions (3x3 for 9 columns)
  const spacing = 30
  
  const totalWidth = (gridSize - 1) * spacing
  const totalHeight = (gridSize - 1) * spacing
  const startX = -totalWidth / 2
  const startY = -totalHeight / 2
  const boardWidth = totalWidth + spacing
  const boardHeight = totalHeight + spacing
  
  circuit.add(
    <board width={`${boardWidth}mm`} height={`${boardHeight}mm`} autorouter={"auto-cloud"}>
      {Array.from({ length: totalLEDSubcircuits }, (_, index) => {
          const row = Math.floor(index / gridSize)
          const col = index % gridSize
          const columnName = `S${index + 1}`
          const pcbX = startX + (col * spacing)
          const pcbY = startY + (row * spacing)
          const prevColumnName = index > 0 ? `S${index}` : null

          return (
              <>
                  <LedColumns 
                      key={columnName}
                      name={columnName} 
                      pcbX={pcbX}
                      pcbY={pcbY}
                      autorouter={"auto-cloud"}
                  />
                  {prevColumnName && (
                      <trace 
                          from={`.${prevColumnName} .LED9 .pin3`} 
                          to={`.${columnName} .LED1 .pin1`} 
                      />
                  )}
              </>
          )
      })}
    </board>,
  )

  await circuit.renderUntilSettled()

  console.log(circuit.getCircuitJson().filter(({ type }) => type === "source_trace").length)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
