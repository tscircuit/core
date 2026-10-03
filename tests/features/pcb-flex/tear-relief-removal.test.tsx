import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("the bend removal phase removes only its generated tear reliefs", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} schematicDisabled routingDisabled>
      <pcbbend
        name="relieved"
        x1={0}
        y1={-5}
        x2={0}
        y2={5}
        bendAngle={0}
        bendRadius={2}
        bendSide="left"
        tearReliefRadius={0.5}
      />
      <pcbbend
        name="plain"
        x1={4}
        y1={-5}
        x2={4}
        y2={5}
        bendAngle={0}
        bendRadius={2}
        bendSide="right"
      />
      <cutout shape="circle" pcbX={-5} radius={1} />
    </board>,
  )
  await circuit.renderUntilSettled()
  // Only the opted-in bend generates reliefs, even when the bend angle is zero.
  expect(circuit.db.pcb_cutout.list()).toHaveLength(3)
  const authoredCutout = circuit.db.pcb_cutout.list()[0]!
  const bend = circuit.selectOne(".relieved")!
  bend.shouldBeRemoved = true
  bend.runRenderPhase("PcbFlexRender")
  expect(circuit.db.pcb_cutout.list()).toEqual([authoredCutout])
  expect(circuit.db.pcb_bend.list().map((record) => record.name)).toEqual([
    "plain",
  ])
  bend.runRenderPhase("PcbFlexRender")
  expect(circuit.db.pcb_cutout.list()).toEqual([authoredCutout])
})
