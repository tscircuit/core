import { expect, test } from "bun:test"
import { Circuit } from "lib"
import PcbBossAssembly from "tests/fixtures/pcb-boss-assembly"

test("render reports the assembled PCB and boss overlap without explosion stages", async () => {
  const circuit = new Circuit()
  circuit.add(<PcbBossAssembly includeExplosion={false} />)
  await circuit.renderUntilSettled()

  const errors = circuit.db.cad_assembly_collision_error.list()
  expect(errors).toHaveLength(1)
  const [error] = errors
  expect(error.pcb_board_id).toBe(circuit.db.pcb_board.list()[0].pcb_board_id)
  expect(error.cad_component_id).toBe(
    circuit.db.cad_component.list()[0].cad_component_id,
  )
  expect(error.intersection_volume_mm3).toBeCloseTo(1.416, 3)
  expect(error.is_fatal).toBe(true)
  expect(circuit.db.cad_assembly_collision_check_warning.list()).toEqual([])
  expect(circuit.db.cad_explosion_move.list()).toEqual([])
})
