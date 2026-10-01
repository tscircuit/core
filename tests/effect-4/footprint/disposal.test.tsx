import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Resistor } from "lib/components"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"
import { createControlledFootprintFetch, footprintUrl } from "./helpers"

test("footprint scope disposal is terminal and leaves legacy library jobs independently owned", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  let releaseLegacyFootprint!: (result: {
    footprintCircuitJson: typeof external0402Footprint
  }) => void
  const circuit = new RootCircuit({
    platform: {
      routingDisabled: true,
      footprintLibraryMap: {
        custom: () =>
          new Promise((resolve) => {
            releaseLegacyFootprint = resolve
          }),
      },
    },
    experimentalFootprintLoading: { fetch: fetchFootprint },
  })
  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint={footprintUrl} />
      <resistor name="R2" resistance="10k" footprint="custom:R_0402" pcbX={5} />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  const scope = circuit.experimentalFootprintLoader!
  await scope.dispose()
  await scope.dispose()
  expect(requests[0].signal.aborted).toBe(true)
  expect(requests[0].abortCount).toBe(1)
  expect(requests[0].hasAbortListener).toBe(false)
  expect(scope.activeJobCount).toBe(0)
  expect(circuit.getRunningAsyncEffects().map((job) => job.effectName)).toEqual(
    ["load-lib-footprint"],
  )
  releaseLegacyFootprint({ footprintCircuitJson: external0402Footprint })
  await settled
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  circuit
    .selectOne("resistor.R2")!
    .parent!.add(
      new Resistor({ name: "R3", resistance: "10k", footprint: footprintUrl }),
    )
  await circuit.renderUntilSettled()
  expect(requests).toHaveLength(1)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
})
