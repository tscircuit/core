import { expect, test } from "bun:test"
import { Fragment } from "react"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { loadMechanicalModel } from "./fixtures/mechanical-assembly-models"

test("board anchors accept CSS references to generated NEMA backfaces", async () => {
  const { circuit } = getTestFixture()
  const [driverModel, headerModel] = await Promise.all([
    loadMechanicalModel("soic8_driver"),
    loadMechanicalModel("pinrow8_header"),
  ])
  circuit.add(
    <assembly.device>
      <board
        name="CONTROL"
        width={54}
        height={54}
        thickness={1.6}
        pcbX={3}
        pcbY={4}
        mountedTo=".MOTOR > .backface"
        mountGap={2}
        routingDisabled
      >
        <chip
          name="U_DRIVER"
          footprint="soic8"
          layer="bottom"
          cadModel={{ ...driverModel, modelBoardNormalDirection: "z+" }}
        />
        {[-22, 22].map((x, i) => (
          <pinheader
            key={x}
            name={`J${i + 1}`}
            pinCount={8}
            footprint="pinrow8"
            layer="bottom"
            pcbX={x}
            pcbRotation={90}
            cadModel={{ ...headerModel, modelBoardNormalDirection: "z+" }}
          />
        ))}
        {[-21, 21].flatMap((x) =>
          [-21, 21].map((y) => (
            <Fragment key={`${x},${y}`}>
              <hole pcbX={x} pcbY={y} diameter={3.2} />
            </Fragment>
          )),
        )}
        <pcbnotetext
          text="NEMA17 DRIVER"
          pcbX={3}
          pcbY={-19}
          fontSize={2}
          layer="bottom"
        />
        <pcbnotetext
          text="MOTOR REAR / 2 mm GAP"
          pcbX={0}
          pcbY={24}
          fontSize={1.4}
        />
      </board>
      <assembly.motor
        name="MOTOR"
        model="nema17_bodylength40mm_plainbackface"
      />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const motor = circuit.db.cad_component.list().find((cad) => {
    const source = circuit.db.source_component.get(cad.source_component_id!)
    return source?.name === "MOTOR"
  })!
  expect(motor.position.x).toBeCloseTo(3)
  expect(motor.position.y).toBeCloseTo(4)
  expect(motor.position.z).toBeCloseTo(42.8)
  expect(circuit.db.pcb_board.list()[0]!.center).toEqual({ x: 3, y: 4 })
  const json = await withLocalNemaMesh(circuit.getCircuitJson())
  await expectAssemblySnapshot(import.meta.path, {
    title: "Controller PCB: CSS selector mounts to a generated NEMA rear face",
    layout: "model_focus",
    panels: [
      {
        title: "NEMA17 and a rear controller board with a 2 mm clearance",
        code: '<board name="CONTROL"\n  width={54} height={54}\n  pcbX={3} pcbY={4}\n  mountedTo=".MOTOR > .backface"\n  mountGap={2}>\n  ...\n</board>\n<assembly.motor name="MOTOR"\n  model={motorModel}/>',
        annotation:
          "PCB midplane Z=0; top Z=0.8; motor rear Z=2.8; motor front Z=42.8 mm.\nThe board stays centered at [3,4]; the motor moves to satisfy the rear-face constraint.",
        circuit: json,
        legend: [
          { color: "#424a52", label: "NEMA17, 40 mm / flush rear" },
          { color: "#247b42", label: "54 mm controller PCB" },
        ],
        renderOptions: {
          camPos: [-110, 95, 145],
          poppygl: { lookAt: [-3, 22, 4] },
        },
      },
      {
        title: "Underside: driver IC, mounting holes and the rear-face gap",
        code: '// PCB and motor share X/Y center\nboard.center = [3,4]\nmotor.origin = [3,4,42.8]\n\n// Board-local driver on underside\n<chip name="U_DRIVER"\n  footprint="soic8"\n  layer="bottom" ... />',
        annotation:
          "The second camera exposes the controller underside and the clearance below the motor.\nViews render the same circuit JSON; the motor model is pinned locally for repeatable snapshots.",
        circuit: json,
        legend: [
          { color: "#303946", label: "JSCAD Electronics SOIC8 + headers" },
          { color: "#b4bec8", label: "Four M3 mounting holes" },
        ],
        renderOptions: {
          camPos: [-78, -65, 95],
          poppygl: { lookAt: [-3, 10, 4] },
        },
      },
    ],
  })
})
