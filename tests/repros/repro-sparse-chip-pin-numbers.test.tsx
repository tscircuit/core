import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("native chip preserves sparse pin numbers", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U1"
      manufacturerPartNumber="NN2-24S05C3N"
      pinLabels={{
        pin1: "VIN_POS",
        pin2: "GND",
        pin5: "VO_NEG",
        pin7: "VO_POS",
      }}
      footprint={
        <footprint>
          <smtpad
            shape="rect"
            width={1}
            height={1}
            portHints={["1"]}
            pcbX={-1}
            pcbY={1}
          />
          <smtpad
            shape="rect"
            width={1}
            height={1}
            portHints={["2"]}
            pcbX={-1}
            pcbY={-1}
          />
          <smtpad
            shape="rect"
            width={1}
            height={1}
            portHints={["5"]}
            pcbX={1}
            pcbY={-1}
          />
          <smtpad
            shape="rect"
            width={1}
            height={1}
            portHints={["7"]}
            pcbX={1}
            pcbY={1}
          />
        </footprint>
      }
    />,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
