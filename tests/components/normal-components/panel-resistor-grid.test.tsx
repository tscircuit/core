import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel with a grid of resistors on boards", async () => {
  const { circuit } = getTestFixture()

  const boardWidth = 10
  const boardHeight = 5
  const numBoardsX = 2
  const numBoardsY = 2

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
    <panel width={35} height={20}>
      {boards.map((pos, i) => (
        <board
          key={i}
          name={`B${i}`}
          width={`${boardWidth}mm`}
          height={`${boardHeight}mm`}
          {...pos}
        >
          <resistor
            name={`R${i}`}
            resistance="1k"
            footprint="0603"
            connections={{
              pin2: `.R${i + 1} > .pin1`,
            }}
          />
          <resistor
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0603"
            connections={{
              pin2: `.R${i} > .pin1`,
            }}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("panel with a grid of resistors on boards with no explicit positions", async () => {
  const { circuit } = getTestFixture()

  const boardWidth = 10 // mm
  const boardHeight = 5 // mm
  const numBoardsX = 4
  const numBoardsY = 4

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
    <panel>
      {boards.map((pos, i) => (
        <board
          key={i}
          name={`B${i}`}
          width={`${boardWidth}mm`}
          height={`${boardHeight}mm`}
        >
          <resistor
            name={`R${i}`}
            resistance="1k"
            footprint="0603"
            connections={{
              pin2: `.R${i + 1} > .pin1`,
            }}
          />
          <resistor
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0603"
            connections={{
              pin2: `.R${i} > .pin1`,
            }}
          />
        </board>
      ))}
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-no-explicit-positions",
  )
})
