import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectBorderRadius survives component rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={5}>
      <chip
        name="U1"
        pcbX={-2}
        pcbRotation={45}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1.95}
              height={0.6}
              rectBorderRadius={0.15}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={2}
        pcbRotation={90}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1.95}
              height={0.6}
              rectBorderRadius={0.15}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="radius 0.15mm: 45 and 90 degrees"
        pcbY={1.8}
        fontSize={0.3}
      />
    </board>,
  )
  circuit.render()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    {
      shape: "rotated_rect",
      width: 1.95,
      height: 0.6,
      ccw_rotation: 45,
      corner_radius: 0.15,
    },
    { shape: "rect", width: 0.6, height: 1.95, corner_radius: 0.15 },
  ])
})
