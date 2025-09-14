import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test("example30: Board with polygon shape smtpad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={35} height={30}>
      <PolygonSmtpadPinRow name="J1" pcbX={-10} pcbY={-10} />
      <chip
        name="U3"
        footprint="soic8"
        connections={{ pin1: "J1.pin1", pin7: "J2.pin4" }}
      />
      <PolygonSmtpadPinRow name="J2" pcbX={-10} pcbY={10} />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

const PolygonSmtpadPinRow = (props: {
  name: string
  pcbX: number
  pcbY: number
}) => {
  return (
    <chip
      {...props}
      footprint={
        <footprint>
          {[1, 2, 3, 4].map((i) => {
            const offsetX = (i - 1) * 6
            return (
              <smtpad
                shape="polygon"
                layer="top"
                portHints={[i.toString()]}
                points={[
                  { x: -2 + offsetX, y: 2 },
                  { x: 1 + offsetX, y: 2 },
                  { x: 2 + offsetX, y: 1 },
                  { x: 2 + offsetX, y: -1 },
                  { x: 1 + offsetX, y: -2 },
                  { x: -2 + offsetX, y: -2 },
                ]}
              />
            )
          })}
        </footprint>
      }
    />
  )
}
