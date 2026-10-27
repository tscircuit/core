import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectBorderRadius survives rendering, including parent rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} schematicDisabled routingDisabled>
      {[0, 45].map((rotation, column) => (
        <chip
          key={rotation}
          name={`U${column + 1}`}
          pcbX={column * 10 - 5}
          pcbRotation={rotation}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                width={3}
                height={2}
                rectBorderRadius="0.5mm"
                portHints={["1"]}
              />
            </footprint>
          }
        />
      ))}
      <smtpad
        shape="rect"
        width={3}
        height={2}
        cornerRadius={0.5}
        pcbY={-4}
        portHints={[]}
      />
      <pcbnotetext
        text="rectBorderRadius=0.5: 0 / 45 degrees"
        pcbY={4}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Control below: cornerRadius=0.5 works"
        pcbY={-2}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list().map((pad) => pad.shape)).toEqual([
    "rect",
    "rotated_rect",
    "rect",
  ])
  expect(circuit.db.pcb_smtpad.list()[2]).toMatchObject({ corner_radius: 0.5 })
  expect(circuit.db.pcb_smtpad.list().slice(0, 2)).toMatchObject([
    { shape: "rect", rect_border_radius: 0.5 },
    { shape: "rotated_rect", rect_border_radius: 0.5 },
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
