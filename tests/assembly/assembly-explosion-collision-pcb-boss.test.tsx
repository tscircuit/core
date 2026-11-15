import { expect, test } from "bun:test"
import { loadCollisionManifold } from "@tscircuit/cad-collision-checking"
import { Circuit, getAssemblyExplosion } from "lib"
import { createBoardCollisionSolid } from "lib/assembly-explosion/collision/create-board-collision-solid"
import { createCadCollisionSolid } from "lib/assembly-explosion/collision/create-cad-collision-solid"
import PcbBossAssembly from "tests/fixtures/pcb-boss-assembly"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("lowering a tray boss away from an initially obstructed PCB sweeps no new PCB volume", async () => {
  const circuit = new Circuit()
  circuit.add(<PcbBossAssembly />)
  await circuit.renderUntilSettled()

  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toEqual([])
  const errors = circuit.db.cad_explosion_collision_error.list()
  expect(errors).toEqual([])
  const initialCollisions = circuit.db.cad_assembly_collision_error.list()
  expect(initialCollisions).toHaveLength(1)
  expect(initialCollisions[0].intersection_volume_mm3).toBeCloseTo(1.416, 3)

  const circuitJson = circuit.getCircuitJson()
  const manifold = await loadCollisionManifold()
  const board = createBoardCollisionSolid(
    circuit.db.pcb_board.list()[0],
    circuitJson,
    manifold,
  )!
  const boss = createCadCollisionSolid(
    circuit.db.cad_component.list()[0],
    circuitJson,
    manifold,
  )
  const intersection = board.intersect(boss)
  const volume = intersection.volume()
  const { min, max } = intersection.boundingBox()
  try {
    expect(volume).toBeCloseTo(1.416, 3)
    expect(max[0] - min[0]).toBeCloseTo(0.45, 3)
  } finally {
    intersection.delete()
    boss.delete()
    board.delete()
  }

  await expectAssemblySnapshot(import.meta.path, {
    title: "Tray screw boss overlaps the PCB in the assembled pose",
    panels: [
      {
        title: "PCB edge at X = 75 mm",
        code: [
          "<board width={150} height={14}",
          "  thickness={1.6} />",
          "<jscad.translate offset={[77.2, 0, -3.5]}>",
          "  <jscad.extrudeLinear height={6.65}>",
          "    <jscad.polygon points={bossOutline} />",
          "  </jscad.extrudeLinear>",
          "</jscad.translate>",
          "<assembly.explosion.move",
          '  targetRef="BOSS" offZ={-11} />',
        ].join("\n"),
        annotation: `Initial overlap ${volume.toFixed(3)} mm³ · 0.45 mm into the PCB.\nLowering the tray 11 mm sweeps no new PCB volume.`,
        circuit: circuitJson,
        callouts: [
          {
            label: "PCB / boss overlap",
            at: [0.115, 0.71],
            target: [0.445, 0.42],
          },
        ],
        renderOptions: {
          camPos: [-89, 11, -14],
          poppygl: { lookAt: [-75, 0, 0] },
        },
      },
    ],
  })
})
