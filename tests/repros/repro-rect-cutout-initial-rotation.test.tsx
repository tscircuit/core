import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a rectangular cutout follows its footprint's 45 degree rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={12} routingDisabled schAutoLayoutEnabled>
      <chip
        name="U1"
        pcbRotation={45}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={-3}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rect"
              width={1}
              height={1}
              pcbX={3}
              portHints={["pin2"]}
            />
            <cutout shape="rect" width={4} height={1} />
          </footprint>
        }
      />
      <pcbnotetext
        text="Cutout should align with the 45 degree pads"
        pcbY={-5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const cutout = circuit.db.pcb_cutout.list()[0]!
  if (cutout.shape !== "rect") throw new Error("Expected rectangular cutout")
  expect(circuit.db.pcb_component.list()[0]!.rotation).toBe(45)
  expect(cutout.rotation).toBeCloseTo(45)
  expect(cutout.width).toBe(4)
  expect(cutout.height).toBe(1)
  const bounds = circuit.selectOne("cutout")!._getPcbCircuitJsonBounds()
  expect(bounds.width).toBeCloseTo(3.535534)
  expect(bounds.height).toBeCloseTo(3.535534)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
