import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test("example30: Board with polygon shape smtpad", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={16}>
      <PolygonSmtpads name="U1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

const PolygonSmtpads = (props: { name: string }) => {
  return (
    <chip
      {...props}
      footprint={
        <footprint>
          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin1"]}
            points={[
              { x: -4.5, y: 2 },
              { x: -2.2, y: 2 },
              { x: -0.4, y: 0 },
              { x: -2.2, y: -2 },
              { x: -4.5, y: -2 },
            ]}
          />

          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin2"]}
            points={[
              { x: -1.8, y: 2 },
              { x: 1.8, y: 2 },
              { x: 3.6, y: 0 },
              { x: 1.8, y: -2 },
              { x: -1.8, y: -2 },
              { x: 0, y: 0 },
            ]}
          />

          <smtpad
            shape="polygon"
            layer="top"
            portHints={["pin3"]}
            points={[
              { x: 2.2, y: 2 },
              { x: 6, y: 2 },
              { x: 6, y: -2 },
              { x: 2.2, y: -2 },
              { x: 4, y: 0 },
            ]}
          />
        </footprint>
      }
    />
  )
}
