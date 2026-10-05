import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a bottom cutout composes group and footprint rotations", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={12} routingDisabled schAutoLayoutEnabled>
      <group pcbRotation={30}>
        <chip
          name="U1"
          layer="bottom"
          pcbRotation={15}
          footprint={
            <footprint>
              <smtpad
                shape="rect"
                pcbX={3}
                width={1}
                height={1}
                portHints={["pin1"]}
              />
              <cutout shape="rect" width={4} height={1} />
            </footprint>
          }
        />
      </group>
      <pcbnotetext
        text="Bottom cutout: 30 + 15 degrees"
        pcbY={-5}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const cutout = circuit.db.pcb_cutout.list()[0]!
  if (cutout.shape !== "rect") throw new Error("Expected rectangular cutout")
  const pad = circuit.db.pcb_smtpad.list()[0]!
  if (pad.shape !== "rotated_rect") throw new Error("Expected rotated pad")
  const padAxisDegrees =
    (Math.atan2(pad.y - cutout.center.y, pad.x - cutout.center.x) * 180) /
    Math.PI
  expect(((cutout.rotation! % 180) + 180) % 180).toBeCloseTo(
    ((padAxisDegrees % 180) + 180) % 180,
  )
  expect(((cutout.rotation! % 180) + 180) % 180).toBeCloseTo(45)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showPcbNotes: true })
})
