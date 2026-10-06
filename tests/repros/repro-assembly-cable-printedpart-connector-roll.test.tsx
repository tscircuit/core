import { expect, test } from "bun:test"
import type { BoardProps } from "@tscircuit/props"
import { assembly } from "lib"
import { Fragment } from "react"
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
        <Fragment key={`${x},${y}`}>
          <hole diameter="3.2mm" pcbX={x} pcbY={y} />
        </Fragment>
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
// The legacy panel omits endpoint lookup context to reproduce the old
// renderer behavior; fixed panels use the unchanged emitted Circuit JSON.
test("docs motor-spacer cable plug aligns automatically with its board header", async () => {
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

  const legacyJson = circuit.getCircuitJson().map((element) =>
    element.type === "cad_cable"
      ? {
          ...element,
          from_source_component_id: "legacy_from",
          to_source_component_id: "legacy_to",
        }
      : element,
  )

  await expectAssemblySnapshot(import.meta.path, {
    title: "Docs cable alignment / before and after",
    font: "alphabet",
    panels: [
      {
        title: "Before / route tangents leave connector roll ambiguous",
        code: `// Same circuit, path and camera.
// Omit endpoint lookup context
// to reproduce the legacy roll.
// Physical geometry is unchanged.

// The plug's pin row crosses the
// board header at 90 degrees.`,
        annotation:
          "Legacy rendering: the route fixes insertion direction, but cannot fix roll.",
        circuit: legacyJson,
        renderOptions: {
          poppygl: { camPos: [33, 30, 30], lookAt: [0, 10, 0], fov: 36 },
        },
      },
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
          "Fixed: each plug follows its header, with wire twist inferred between the endpoints.",
        circuit,
        renderOptions: {
          poppygl: { camPos: [100, 90, 75], lookAt: [0, -12, 0], fov: 40 },
        },
      },
      {
        title: "After / automatically aligned with the board header",
        code: `<connector name="J_MOTOR"
  standard="jst_ph" pinCount={6}
  footprint="jst6_ph"
  pcbX={0} pcbY={0} />

// No pcbRotation, cable path,
// CAD rotation or extra TSX.
// Expected: plug aligns with the
// existing header automatically.
// Plug width follows the header.
// Wire exits follow the plug.`,
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
