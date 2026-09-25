import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rectBorderRadius preserves the radius of rectangular pads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={6} height={4}>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1.95}
              height={0.6}
              rectBorderRadius="0.15mm"
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <pcbnotetext text="rectBorderRadius = 0.15mm" pcbY={1} fontSize={0.3} />
    </board>,
  )
  circuit.render()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    { shape: "rect", width: 1.95, height: 0.6, corner_radius: 0.15 },
  ])
})
