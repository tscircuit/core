import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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

test("castellated pinout board renders", () => {
  const { circuit } = getTestFixture()
  const originalFetch = globalThis.fetch
  const fetchCalls: Array<Parameters<typeof fetch>> = []
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    fetchCalls.push(args)
    return Promise.reject(
      new Error("fetch should not be called when routing is disabled"),
    )
  }) as typeof fetch

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

  try {
    expect(() => circuit.render()).not.toThrow()
    expect(fetchCalls.length).toBe(0)
  } finally {
    globalThis.fetch = originalFetch
  }
})
