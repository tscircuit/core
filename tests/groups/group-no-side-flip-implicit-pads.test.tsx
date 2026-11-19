import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("implicit pads keep their legacy layer without a group flip", async () => {
  const footprint = (
    <footprint originalLayer="bottom">
      <smtpad shape="rect" width={1} height={0.6} pcbX={-1} portHints={["1"]} />
      <smtpad
        shape="circle"
        layer="bottom"
        radius={0.4}
        pcbX={1}
        portHints={["2"]}
      />
    </footprint>
  )
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={30} height={16} schematicDisabled routingDisabled>
      <group name="empty" />
      <group>
        <chip name="U1" footprint={footprint} pcbX={-9} />
      </group>
      <group layer="top">
        <chip name="U2" footprint={footprint} pcbX={-3} />
      </group>
      <group pcbRotation={30}>
        <chip name="U3" footprint={footprint} pcbX={3} />
      </group>
      <chip name="U4" footprint={footprint} pcbX={9} />
      <pcbnotetext
        text="Implicit rectangular pads stay top on bottom-authored footprints"
        pcbY={5}
        fontSize={0.45}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_smtpad.list().map(({ layer }) => layer)).toEqual([
    "top",
    "bottom",
    "top",
    "bottom",
    "top",
    "bottom",
    "top",
    "bottom",
  ])
  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
