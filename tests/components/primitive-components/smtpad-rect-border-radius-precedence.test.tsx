import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cornerRadius takes precedence over rectBorderRadius including zero", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={4}>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              pcbX={-2}
              width={1.95}
              height={0.6}
              rectBorderRadius={0.15}
              cornerRadius={0.25}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              pcbX={2}
              width={1.95}
              height={0.6}
              rectBorderRadius={0.15}
              cornerRadius={0}
              portHints={["pin2"]}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="cornerRadius wins: 0.25mm and 0mm"
        pcbY={1}
        fontSize={0.3}
      />
    </board>,
  )
  circuit.render()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_smtpad.list()).toMatchObject([
    { shape: "rect", corner_radius: 0.25 },
    { shape: "rect", corner_radius: 0 },
  ])
})
