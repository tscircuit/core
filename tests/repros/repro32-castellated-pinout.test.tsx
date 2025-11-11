import { expect, test } from "bun:test"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Debug from "debug"
import { SchematicTracePipelineSolver } from "@tscircuit/schematic-trace-solver"

declare global {
  // eslint-disable-next-line no-var
  var debugOutputArray:
    | Array<{
        name: string
        obj: any
      }>
    | undefined
}

const pitch = 1
const boardSize = 10
const pinsPerSide = 6
const boardEdgeMargin = (boardSize - pitch * (pinsPerSide - 1)) / 2

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

const CastellatedHole = (props: {
  name: string
  pcbX: number | string
  pcbY: number | string
  facingDirection?: "x+" | "x-" | "y+" | "y-"
}) => (
  <platedhole
    shape="circular_hole_with_rect_pad"
    holeDiameter={0.5}
    rectPadWidth={0.5}
    rectPadHeight={0.5}
    portHints={[props.name]}
    holeOffsetX={
      props.facingDirection === "x+"
        ? -0.25
        : props.facingDirection === "x-"
          ? 0.25
          : 0
    }
    holeOffsetY={
      props.facingDirection === "y+"
        ? -0.25
        : props.facingDirection === "y-"
          ? 0.25
          : 0
    }
    pcbX={props.pcbX}
    pcbY={props.pcbY}
  />
)

test("castellated pinout reproduction captures solver input", () => {
  const { circuit } = getTestFixture()
  const originalFetch = globalThis.fetch
  const fetchCalls: Array<Parameters<typeof fetch>> = []
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    fetchCalls.push(args)
    return Promise.reject(
      new Error("fetch should not be called when routing is disabled"),
    )
  }) as typeof fetch

  const previousDebugNamespaces = Debug.disable()
  const namespacesToEnable = previousDebugNamespaces
    ? `${previousDebugNamespaces},Group_doInitialSchematicTraceRender`
    : "Group_doInitialSchematicTraceRender"
  Debug.enable(namespacesToEnable)

  globalThis.debugOutputArray = []

  circuit.add(
    <board width="10mm" height="10mm" autorouter="auto_cloud" routingDisabled>
      <pinout
        name="P"
        footprint={
          <footprint>
            {range(1, pinsPerSide)
              .map((n) => ({
                pinNumber: n,
                index: n - 1,
              }))
              .map(({ index, pinNumber }) => (
                <CastellatedHole
                  key={`left-${pinNumber}`}
                  facingDirection="x+"
                  pcbX={-boardSize / 2 + 0.25}
                  pcbY={boardSize / 2 - index - boardEdgeMargin}
                  name={`pin${pinNumber}`}
                />
              ))}
            {range(1, pinsPerSide)
              .map((n) => ({
                pinNumber: pinsPerSide + n,
                index: n - 1,
              }))
              .map(({ index, pinNumber }) => (
                <CastellatedHole
                  key={`top-${pinNumber}`}
                  facingDirection="y-"
                  pcbX={-boardSize / 2 + index + boardEdgeMargin}
                  pcbY={boardSize / 2 - 0.25}
                  name={`pin${pinNumber}`}
                />
              ))}
            {range(1, pinsPerSide)
              .map((n) => ({
                pinNumber: pinsPerSide * 2 + n,
                index: n - 1,
              }))
              .map(({ index, pinNumber }) => (
                <CastellatedHole
                  key={`right-${pinNumber}`}
                  facingDirection="x-"
                  pcbX={boardSize / 2 - 0.25}
                  pcbY={boardSize / 2 - index - boardEdgeMargin}
                  name={`pin${pinNumber}`}
                />
              ))}
            {range(1, pinsPerSide)
              .map((n) => ({
                pinNumber: pinsPerSide * 3 + n,
                index: n - 1,
              }))
              .map(({ index, pinNumber }) => (
                <CastellatedHole
                  key={`bottom-${pinNumber}`}
                  facingDirection="y+"
                  pcbX={boardSize / 2 - index - boardEdgeMargin}
                  pcbY={-boardSize / 2 + 0.25}
                  name={`pin${pinNumber}`}
                />
              ))}
          </footprint>
        }
      />
      {range(1, pinsPerSide).map((n) => (
        <trace
          key={`trace-${n}`}
          from={`P.pin${n}`}
          to={`P.pin${pinsPerSide * 3 + 1 - n}`}
        />
      ))}
      <trace from="P.pin7" to="P.pin19" />
    </board>,
  )

  const originalSolve = SchematicTracePipelineSolver.prototype.solve
  SchematicTracePipelineSolver.prototype.solve = function captureSolve() {
    throw new Error("__CAPTURED_SOLVER_INPUT__")
  }

  try {
    expect(() => circuit.render()).toThrow("__CAPTURED_SOLVER_INPUT__")
    expect(fetchCalls.length).toBe(0)

    const solverInputDebug = globalThis.debugOutputArray?.find(
      ({ name }) => name === "group-trace-render-input-problem",
    )

    expect(solverInputDebug).toBeDefined()
    const solverInput = JSON.parse(String(solverInputDebug?.obj))
    const expectedSolverInputPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "repro32-castellated-pinout.schematicTraceSolverInput.json",
    )
    if (process.env.BUN_UPDATE_SOLVER_INPUT === "1") {
      writeFileSync(
        expectedSolverInputPath,
        `${JSON.stringify(solverInput, null, 2)}\n`,
      )
    }

    const expectedSolverInput = JSON.parse(
      readFileSync(expectedSolverInputPath, "utf-8"),
    )

    expect(solverInput).toEqual(expectedSolverInput)
  } finally {
    SchematicTracePipelineSolver.prototype.solve = originalSolve
    globalThis.fetch = originalFetch
    globalThis.debugOutputArray = undefined
    if (previousDebugNamespaces) {
      Debug.enable(previousDebugNamespaces)
    } else {
      Debug.disable()
    }
  }
})
