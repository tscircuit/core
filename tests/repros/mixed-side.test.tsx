import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mixed-side connector pads and plated slot follow the footprint mounting side", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={14} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).map((layer, index) => (
        <chip
          key={layer}
          name={`J${index + 1}`}
          layer={layer}
          pcbX={index * 12 - 6}
          pcbRotation={30}
          pinLabels={{ 1: "CONTACT", 2: "LATCH" }}
          footprint={
            <footprint originalLayer="top">
              <smtpad
                portHints={["pin1"]}
                layer="top"
                shape="rect"
                pcbX={-2}
                width={1.5}
                height={1}
              />
              <smtpad
                portHints={["pin2"]}
                layer="bottom"
                shape="rect"
                pcbX={2}
                width={1.5}
                height={1}
              />
              <platedhole
                shape="pill"
                pcbY={2}
                outerWidth={3.1}
                outerHeight={1.1}
                holeWidth={2.3}
                holeHeight={0.7}
                pcbRotation={10}
              />
            </footprint>
          }
        />
      ))}
      <pcbnotetext
        pcbX={-6}
        pcbY={-4}
        text="J1 top / slot 40 deg"
        fontSize={0.55}
      />
      <pcbnotetext
        pcbX={6}
        pcbY={-4}
        text="J2 bottom / slot 20 deg"
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const padLayers = circuit.db.pcb_smtpad.list().map((pad) => pad.layer)
  const slotAxes = circuit.db.pcb_plated_hole.list().map((hole) => {
    if (hole.shape !== "pill") throw new Error("Expected plated slot")
    return Math.round((hole.ccw_rotation ?? 0) % 180)
  })
  expect({ padLayers, slotAxes }).toMatchSnapshot()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
