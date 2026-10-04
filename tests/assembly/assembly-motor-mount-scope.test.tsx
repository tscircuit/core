import { withLocalNemaMesh } from "./fixtures/with-local-nema-mesh"
import { expect, test } from "bun:test"
import { assembly } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("identical motor names in sibling devices resolve within each device", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="product">
      <assembly.device name="left">
        <assembly.motor
          name="MOTOR"
          standard="nema8"
          shaftFacingDirection="z-"
        />
        <board
          name="B1"
          width={24}
          height={24}
          thickness={2}
          pcbX={-45}
          mountedTo="MOTOR.backface"
          mountGap={3}
          routingDisabled
        />
      </assembly.device>
      <assembly.device name="right">
        <board
          name="B2"
          width={58}
          height={58}
          thickness={2}
          pcbX={45}
          mountedTo="MOTOR.backface"
          mountGap={8}
          routingDisabled
        />
        <assembly.motor name="MOTOR" standard="nema23" />
      </assembly.device>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const json = await withLocalNemaMesh(circuit.getCircuitJson())
  const motors = circuit.db.cad_component.list()
  expect(
    motors.find((cad) => cad.model_glb_url?.includes("nema8"))?.position,
  ).toEqual({ x: -45, y: 0, z: -37 })
  expect(
    motors.find((cad) => cad.model_glb_url?.includes("nema23"))?.position,
  ).toEqual({ x: 45, y: 0, z: 60 })
  // The GLB exporter renders one PCB at a time. Give each device its own
  // annotated panel, using records from the same fully rendered circuit.
  const panels = circuit.db.pcb_board.list().map((board, index) => {
    const left = index === 0
    const standard = left ? "nema8" : "nema23"
    const x = left ? -45 : 45
    const boardSize = left ? 24 : 58
    return {
      title: left ? "Left device: B1 on NEMA8" : "Right device: B2 on NEMA23",
      code: `<assembly.device name="${left ? "left" : "right"}">
  <assembly.motor name="MOTOR"
    standard="${standard}"
    shaftFacingDirection="${left ? "z-" : "z+"}" />
  <board name="${left ? "B1" : "B2"}"
    pcbX={${x}}
    width={${boardSize}} height={${boardSize}}
    thickness={2}
    mountedTo="MOTOR.backface"
    mountGap={${left ? 3 : 8}}
  />
</assembly.device>`,
      annotation: left
        ? "MOTOR resolves inside left / NEMA8 below B1 / 3 mm surface gap"
        : "MOTOR resolves inside right / NEMA23 above B2 / 8 mm surface gap",
      circuit: json.filter(
        (el) =>
          (el.type === "pcb_board" || el.type === "cad_component") &&
          el.subcircuit_id === board.subcircuit_id,
      ),
      renderOptions: {
        camPos: [-x + 100, left ? 35 : 85, 100] as [number, number, number],
        poppygl: {
          lookAt: [-x, left ? -22 : 35, 0] as [number, number, number],
        },
      },
    }
  })
  await expectAssemblySnapshot(import.meta.path, {
    title: "Same motor name, independent assembly devices",
    panels,
  })
})
