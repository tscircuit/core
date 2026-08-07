import { expect, test } from "bun:test"
import { solvePackSolverWithTimeout } from "lib/utils/packing/solvePackSolverWithTimeout"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("platform pack solver timeout stops packing and reports an error", () => {
  const solver = {
    solved: false,
    failed: false,
    solve: () => {
      throw new Error("solve should not be called when a timeout is configured")
    },
    step: () => {},
  }
  const times = [100, 102, 106]

  const result = solvePackSolverWithTimeout(solver, 5, () => times.shift()!)

  expect(result).toEqual({ elapsedMs: 6, timedOut: true })

  const { circuit } = getTestFixture({
    platform: { pcbPackSolverTimeoutMs: Number.EPSILON },
  })

  circuit.add(
    <board routingDisabled>
      {Array.from({ length: 20 }, (_, index) => (
        <resistor
          key={index}
          name={`R${index + 1}`}
          footprint="0402"
          resistance="1k"
        />
      ))}
    </board>,
  )

  circuit.render()

  const packingErrors = circuit.db.pcb_packing_error.list()
  expect(packingErrors).toHaveLength(1)
  expect(packingErrors[0]?.message).toContain(
    `PackSolver2 timed out after ${Number.EPSILON}ms`,
  )
})
