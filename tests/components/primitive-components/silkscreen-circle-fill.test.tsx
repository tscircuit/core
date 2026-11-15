import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen circle fill preserves solid and outline artwork on both layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={46} height={32} pcbLayout={{ layoutMode: "none" }}>
      <pcbnotetext
        text="CIRCLE FILL: DEFAULT / FALSE / TRUE"
        pcbY={13}
        fontSize={1}
      />
      {(["top", "bottom"] as const).map((layer, side) => (
        <Fragment key={layer}>
          <pcbnotetext
            text={layer}
            pcbX={-19}
            pcbY={7 - side * 15}
            fontSize={0.8}
          />
          <silkscreencircle
            layer={layer}
            radius={3}
            pcbX={-12}
            pcbY={5 - side * 15}
            strokeWidth={0.25}
          />
          <silkscreencircle
            layer={layer}
            radius={3}
            pcbX={0}
            pcbY={5 - side * 15}
            strokeWidth={0.25}
            isFilled={false}
          />
          <silkscreencircle
            layer={layer}
            radius={3}
            pcbX={12}
            pcbY={5 - side * 15}
            strokeWidth={0.25}
            isFilled
          />
        </Fragment>
      ))}
    </board>,
  )
  circuit.render()
  const circles = circuit.db.pcb_silkscreen_circle.list()
  expect(circles.map((circle) => circle.is_filled ?? false)).toEqual([
    false,
    false,
    true,
    false,
    false,
    true,
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
