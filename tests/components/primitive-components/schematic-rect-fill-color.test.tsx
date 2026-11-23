import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicRect preserves fillColor in circuit JSON", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm" routingDisabled>
      <chip
        name="U1"
        footprint="dip2"
        pinLabels={{ pin1: ["A"], pin2: ["B"] }}
        symbol={
          <symbol>
            <schematicrect
              schX={0}
              schY={1.5}
              width={4}
              height={2}
              color="#880000"
              isFilled
              fillColor="#FFFFFF"
            />
            <schematicrect
              schX={0}
              schY={-1.5}
              width={4}
              height={2}
              color="#008800"
              isFilled={false}
              fillColor="#00FF00"
            />
            <schematicrect
              schX={0}
              schY={-4.5}
              width={4}
              height={2}
              color="#000088"
              isFilled
            />
            <port
              name="pin1"
              pinNumber={1}
              direction="left"
              schX={-3}
              schY={0}
            />
            <port
              name="pin2"
              pinNumber={2}
              direction="right"
              schX={3}
              schY={0}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const rects = circuit.db.schematic_rect.list()
  expect(rects).toHaveLength(3)

  const filledWithColor = rects.find((r) => r.color === "#880000")
  expect(filledWithColor).toMatchObject({
    color: "#880000",
    is_filled: true,
    fill_color: "#FFFFFF",
  })

  const unfilledWithColor = rects.find((r) => r.color === "#008800")
  expect(unfilledWithColor).toMatchObject({
    color: "#008800",
    is_filled: false,
    fill_color: "#00FF00",
  })

  const filledWithoutColor = rects.find((r) => r.color === "#000088")
  expect(filledWithoutColor).toMatchObject({
    color: "#000088",
    is_filled: true,
  })
  expect(filledWithoutColor?.fill_color).toBeUndefined()
})
