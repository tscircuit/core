import { expect, test } from "bun:test"
import type { BoardProps } from "@tscircuit/props"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "tests/assembly/fixtures/expect-assembly-snapshot"
import { holeCenters, MotorSpacer } from "tests/assembly/fixtures/motor-spacer"

function MotorController(props: BoardProps) {
  return (
    <board
      width="42mm"
      height="42mm"
      thickness="1.6mm"
      routingDisabled
      {...props}
    >
      {holeCenters.map(([x, y]) => (
        <hole key={`${x},${y}`} diameter="3.2mm" pcbX={x} pcbY={y} />
      ))}
      <connector
        name="J_MOTOR"
        standard="jst_ph"
        pinCount={6}
        footprint="jst6_ph"
        pcbX={0}
        pcbY={0}
      />
    </board>
  )
}

// Reproduce https://docs.tscircuit.com/elements/assembly-printedpart with
// the original connector placement and no cable orientation overrides.
// The snapshots intentionally record the current bug: the cable plug's
// pin row is perpendicular to the board header's pin row.
test("docs motor-spacer cable plug is rolled 90 degrees relative to its board header", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.motor
        name="NEMA17"
        model="nema17_backfaceholes_jstph6"
        shaftFacingDirection="z-"
      />
      <assembly.printedpart
        name="SPACER"
        jscad={<MotorSpacer height={10} />}
        mountedTo="NEMA17.backface"
        mountFace="motor"
      />
      <MotorController name="CONTROLLER" mountedTo="SPACER.board" />
      <assembly.cable
        name="MOTOR_CABLE"
        from="NEMA17.wireside"
        to=".CONTROLLER > .J_MOTOR"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
  const cable = circuit.db.cad_cable.list()[0]!
  expect(cable.cableprinter_string).toBe("jst_ph_pins6")
  const header = circuit.db.source_component
    .list()
    .find((c) => c.name === "J_MOTOR")!
  expect(cable.to_source_component_id).toBe(header.source_component_id)

  await expectAssemblySnapshot(import.meta.path, {
    title: "Docs reproduction: cable plug rotated 90 degrees",
    font: "alphabet",
    panels: [
      {
        title: "Original docs example / automatic cable inference",
        code: `<assembly.device>
  <assembly.motor name="NEMA17"
    model="nema17_backfaceholes_jstph6"
    shaftFacingDirection="z-" />
  <assembly.printedpart name="SPACER"
    jscad={<MotorSpacer height={10} />}
    mountedTo="NEMA17.backface"
    mountFace="motor" />
  <MotorController name="CONTROLLER"
    mountedTo="SPACER.board" />
  <assembly.cable name="MOTOR_CABLE"
    from="NEMA17.wireside"
    to=".CONTROLLER > .J_MOTOR" />
</assembly.device>`,
        annotation:
          "Current bug: the inferred PH plug and board header have perpendicular pin rows.",
        circuit,
        renderOptions: {
          poppygl: { camPos: [100, 90, 75], lookAt: [0, -12, 0], fov: 40 },
        },
      },
      {
        title: "Close-up / same circuit and unchanged geometry",
        code: `<connector name="J_MOTOR"
  standard="jst_ph" pinCount={6}
  footprint="jst6_ph"
  pcbX={0} pcbY={0} />

// No pcbRotation, cable path,
// CAD rotation or extra TSX.
// Expected: plug aligns with the
// existing header automatically.
// Current: plug is a quarter-turn
// away from the header.`,
        annotation:
          "Camera zoom only: inspect the long axes of the plug and the header beneath it.",
        circuit,
        renderOptions: {
          poppygl: { camPos: [33, 30, 30], lookAt: [0, 10, 0], fov: 36 },
        },
      },
    ],
  })
})
