import { expect, test } from "bun:test"
import { enclosure } from "lib"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("generates an FDM enclosure and USB-C aperture with the enclosure solver", async () => {
  const { circuit } = getTestFixture()
  let enclosureSolverEvent: SolverStartedEvent | undefined

  circuit.on("solver:started", (event) => {
    if (event.solverName === "CreateFdmEnclosureSolver") {
      enclosureSolverEvent = event
    }
  })

  circuit.add(
    <group>
      <board name="main-board" width="40mm" height="24mm" routingDisabled>
        <connector
          name="USB1"
          manufacturerPartNumber="USB_C_TEST"
          pcbX="0mm"
          pcbY="11mm"
          allowOffBoard
          pinLabels={{ pin1: ["VBUS"], pin2: ["GND"] }}
          footprint={
            <footprint insertionDirection="from_top">
              <smtpad
                portHints={["pin1"]}
                pcbX="-1.5mm"
                pcbY="0mm"
                width="1mm"
                height="4mm"
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX="1.5mm"
                pcbY="0mm"
                width="1mm"
                height="4mm"
                shape="rect"
              />
            </footprint>
          }
          cadModel={{
            objUrl:
              "https://modelcdn.tscircuit.com/easyeda_models/assets/C165948.obj?uuid=617b05f9bba7410b96c001093d8189e4",
            pcbRotationOffset: 0,
            modelOriginPosition: {
              x: 0,
              y: -2.7500289000000517,
              z: 0.000010999999999872223,
            },
          }}
        >
          <enclosure.cutoutaperture
            shape="pill"
            width="9mm"
            height="3.6mm"
            margin="0.5mm"
          />
        </connector>
      </board>
      <enclosure.fdm.box boardRef=".main-board" showHiddenEdges />
    </group>,
  )

  await circuit.renderUntilSettled()

  expect(enclosureSolverEvent?.solverName).toBe("CreateFdmEnclosureSolver")
  expect(enclosureSolverEvent?.solverParams.board).toEqual({
    width: 40,
    height: 24,
    thickness: 1.4,
  })
  expect(enclosureSolverEvent?.solverParams.apertures[0]).toMatchObject({
    shape: "pill",
    face: "y_pos",
    center: { x: 0 },
  })
  expect(enclosureSolverEvent?.solverConstructorArgs).toEqual([
    enclosureSolverEvent?.solverParams,
  ])
  const enclosureCadComponents = circuit.db.cad_component
    .list()
    .filter((cadComponent) => cadComponent.model_jscad)
  // Base and lid are independently renderable CAD meshes, sharing the existing
  // synthetic PCB owner until the typed schema adds durable part roles.
  expect(enclosureCadComponents).toHaveLength(2)
  expect(
    new Set(enclosureCadComponents.map((cad) => cad.cad_component_id)).size,
  ).toBe(2)
  for (const cad of enclosureCadComponents) {
    expect(cad.show_as_translucent_model).toBe(false)
    expect(cad.show_hidden_edges).toBe(true)
  }

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [30, 24, 50],
    diffTolerance: 0,
    poppygl: {
      lookAt: [0, 0, 3.5],
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })

  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    snapshotSuffix: "top-down-orthographic",
    cameraPreset: "top_down_orthographic",
    poppygl: {
      backgroundColor: [1, 1, 1],
      grid: false,
    },
  })
})
