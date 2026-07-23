import {
  LevelShifter_TXB0104,
  WirelessMCU_CC2745R10,
  WirelessMCU_CC3235SF,
} from "@tsci/tscircuit.ti"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro156: TI wireless subcircuits PCB autolayout", async () => {
  const { circuit } = getTestFixture()
  const packSolverParams: any[] = []

  circuit.on("solver:started", (event) => {
    if (event.solverName === "PackSolver2") {
      packSolverParams.push(event.solverParams)
    }
  })

  circuit.add(
    <board routingDisabled>
      <WirelessMCU_CC3235SF
        name="radio_transceiver"
        schSheetName="radio_transceiver"
      />
      <LevelShifter_TXB0104
        name="radio_level_shifter"
        schSheetName="radio_level_shifter"
      />
      <WirelessMCU_CC2745R10 name="ble_module" schSheetName="ble_module" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(packSolverParams.length).toBeGreaterThan(0)
  expect(
    packSolverParams.every(
      (params) =>
        params.packPlacementStrategy ===
        "minimum_sum_squared_distance_to_network",
    ),
  ).toBe(true)
  expect(
    packSolverParams.every(
      (params) => params.packOrderStrategy === "largest_to_smallest",
    ),
  ).toBe(true)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
