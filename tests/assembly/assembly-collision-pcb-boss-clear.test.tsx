import { expect, test } from "bun:test"
import { Circuit } from "lib"
import PcbBossAssembly from "tests/fixtures/pcb-boss-assembly"

test("render allows a tray boss outside the PCB outline", async () => {
  const circuit = new Circuit()
  circuit.add(<PcbBossAssembly bossX={78} />)
  await circuit.renderUntilSettled()

  expect(circuit.db.cad_assembly_collision_error.list()).toEqual([])
  expect(circuit.db.cad_assembly_collision_check_warning.list()).toEqual([])
})
