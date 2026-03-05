import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro99: two chips with custom svgPath symbols and ports without schX/schY coordinates", async () => {
  const { circuit } = getTestFixture()

  // Triangle (op-amp style)
  const triangleSvgPath = "M -0.5 -0.7 L -0.5 0.7 L 0.7 0 Z"
  // Rectangle (gate style)
  const rectSvgPath = "M -0.6 -0.6 L 0.6 -0.6 L 0.6 0.6 L -0.6 0.6 Z"

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicpath
              svgPath={triangleSvgPath}
              strokeWidth={0.05}
              isFilled={false}
            />
            <port name="IN+" direction="left" />
            <port name="IN-" direction="left" />
            <port name="OUT" direction="right" />
          </symbol>
        }
      />
      <chip
        name="U2"
        symbol={
          <symbol>
            <schematicpath
              svgPath={rectSvgPath}
              strokeWidth={0.05}
              isFilled={false}
            />
            <port name="Y" direction="right" />
          </symbol>
        }
      />
      <trace from=".U1 > .OUT" to=".U2 > .A" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
