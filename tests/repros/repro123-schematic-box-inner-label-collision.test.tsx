import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("schematic box with inner label collision with no manual schHeight/schWidth", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <chip
      name="U1"
      manufacturerPartNumber="part-number"
      pinLabels={{
        1: "LABEL1",
        2: "LABEL2",
        3: "LABEL3",
        4: "LABEL4",
        5: "LABEL5",
        6: "LABEL6",
        7: "LABEL7",
        8: "LABEL8",
        9: "LABEL9",
        10: "LABEL10",
        11: "LABEL11",
        12: "LABEL12",
      }}
      schPinArrangement={{
        leftSide: {
          pins: [1, 2, 3],
          direction: "top-to-bottom",
        },
        rightSide: {
          pins: [4, 5, 6],
          direction: "top-to-bottom",
        },
        topSide: {
          pins: [7, 8, 9],
          direction: "left-to-right",
        },
        bottomSide: {
          pins: [10, 11, 12],
          direction: "left-to-right",
        },
      }}
    />,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
