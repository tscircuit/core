import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnoterect swaps width and height when its parent chip rotates 90 or 270 degrees", async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })

  const cases = [
    { name: "U1", x: -11, rotation: 0 },
    { name: "U2", x: 0, rotation: 90 },
    { name: "U3", x: 11, rotation: 270 },
  ]

  circuit.add(
    <board width={36} height={13} routingDisabled>
      {cases.map(({ name, x, rotation }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={0}
          pcbRotation={rotation}
          pinLabels={{ pin1: "A", pin2: "B" }}
          footprint={
            <footprint>
              <smtpad
                pcbX={-2.5}
                pcbY={0}
                width={1.2}
                height={1.2}
                shape="rect"
                portHints={["pin1"]}
              />
              <smtpad
                pcbX={2.5}
                pcbY={0}
                width={1.2}
                height={1.2}
                shape="rect"
                portHints={["pin2"]}
              />
              <pcbnoterect
                width={8}
                height={3}
                strokeWidth={0.15}
                color="#00ffcc"
              />
            </footprint>
          }
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const noteRects = circuit.db.pcb_note_rect.list()
  expect(noteRects).toHaveLength(3)

  expect(noteRects[0]).toMatchObject({
    center: { x: -11, y: 0 },
    width: 8,
    height: 3,
  })
  expect(noteRects[1]).toMatchObject({
    center: { x: 0, y: 0 },
    width: 3,
    height: 8,
  })
  expect(noteRects[2]).toMatchObject({
    center: { x: 11, y: 0 },
    width: 3,
    height: 8,
  })
})
