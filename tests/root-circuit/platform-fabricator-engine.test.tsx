import { expect, test } from "bun:test"
import type { FabricatorDrcCheckParams } from "@tscircuit/props"
import { pcb_fabricator_extra_charge_warning } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("platform fabricator engine receives final vias and inserts async diagnostics once", async () => {
  const calls: FabricatorDrcCheckParams[] = []
  const { circuit } = getTestFixture({
    platform: {
      fabricatorEngine: {
        async runDrcChecks(params) {
          calls.push(params)
          const vias = params.circuitJson.filter(
            (element) => element.type === "pcb_via",
          )
          return [
            pcb_fabricator_extra_charge_warning.parse({
              type: "pcb_fabricator_extra_charge_warning",
              fabricator_preset: params.fabricatorPreset,
              pcb_board_id: params.pcbBoardId,
              subcircuit_id: params.subcircuitId,
              pcb_via_ids: vias.map((via) => via.pcb_via_id),
              message: "Fabricator plugin diagnostic",
            }),
          ]
        },
      },
    },
  })
  circuit.add(
    <board
      width="10mm"
      height="10mm"
      fabricatorPreset="jlcpcb_economy"
      routingDisabled
    >
      <via
        name="V1"
        pcbX={0}
        pcbY={0}
        holeDiameter="0.25mm"
        outerDiameter="0.6mm"
        fromLayer="top"
        toLayer="bottom"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await circuit.renderUntilSettled()
  expect(calls).toHaveLength(1)
  expect(calls[0].fabricatorPreset).toBe("jlcpcb_economy")
  const vias = circuit.db.pcb_via.list()
  expect(vias).toHaveLength(1)
  const warnings = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_fabricator_extra_charge_warning")
  expect(warnings).toHaveLength(1)
  expect(warnings[0].pcb_via_ids).toEqual([vias[0].pcb_via_id])
  expect(warnings[0].pcb_board_id).toBe(
    circuit.db.pcb_board.list()[0].pcb_board_id,
  )
})
