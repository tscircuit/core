import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Schematic box four sides and other layouts test", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10}>
      <chip
        name="4_Sides"
        manufacturerPartNumber="part-number"
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
        schX={-6.5}
        schY={0}
        schWidth={1}
        schHeight={1}
        footprint="ssop28Db"
      />
      <chip
        name="RL_Sides"
        manufacturerPartNumber="part-number"
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [4, 5, 6],
            direction: "top-to-bottom",
          },
        }}
        schX={-3.5}
        schY={0}
        schWidth={1}
        schHeight={1}
        footprint="ssop28Db"
      />
      <chip
        name="RLT_Sides"
        manufacturerPartNumber="part-number"
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
        }}
        schX={-0.5}
        schY={0}
        schWidth={1}
        schHeight={1}
        footprint="ssop28Db"
      />
      <chip
        name="RLB_Sides"
        manufacturerPartNumber="part-number"
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [4, 5, 6],
            direction: "top-to-bottom",
          },
          bottomSide: {
            pins: [7, 8, 9],
            direction: "left-to-right",
          },
        }}
        schX={-6.5}
        schY={-2}
        schWidth={1}
        schHeight={1}
        footprint="ssop28Db"
      />
      <chip
        name="R_Side"
        manufacturerPartNumber="part-number"
        schPinArrangement={{
          rightSide: {
            pins: [1, 2, 3],
            direction: "top-to-bottom",
          },
        }}
        schX={-3.5}
        schY={-2}
        schWidth={1}
        schHeight={1}
        footprint="ssop28Db"
      />
      <chip
        name="L_Side"
        manufacturerPartNumber="part-number"
        schPinArrangement={{
          leftSide: {
            pins: [1, 2, 3],
            direction: "top-to-bottom",
          },
        }}
        schX={-0.5}
        schY={-2}
        schWidth={1}
        schHeight={1}
        footprint="ssop28Db"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
