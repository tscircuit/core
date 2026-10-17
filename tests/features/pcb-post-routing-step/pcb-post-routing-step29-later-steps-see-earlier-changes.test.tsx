import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a later step sees the elements an earlier step inserted", async () => {
  const { circuit } = getTestFixture()
  let viasSeenBySecond = -1
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep
        order={1}
        fn={(ctx) => {
          ctx.insert({
            type: "pcb_via",
            x: 0,
            y: 3,
            outer_diameter: 0.6,
            hole_diameter: 0.3,
            layers: ["top", "bottom"],
          })
        }}
      />
      <pcbpostroutingstep
        order={2}
        fn={(ctx) => {
          viasSeenBySecond = ctx
            .getCircuitJson()
            .filter((e) => e.type === "pcb_via").length
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(viasSeenBySecond).toBe(1)
})
