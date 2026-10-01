import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import {
  createControlledFootprintFetch,
  footprintResponse,
  footprintUrl,
} from "./helpers"

test("removing an ancestor cancels its descendant requests without cancelling a sibling job", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  const circuit = new RootCircuit({
    platform: { routingDisabled: true },
    experimentalFootprintLoading: { fetch: fetchFootprint },
  })
  circuit.add(
    <board width="20mm" height="10mm">
      <group name="pending">
        <resistor name="R1" resistance="10k" footprint={footprintUrl} />
        <resistor name="R2" resistance="10k" footprint={footprintUrl} />
      </group>
      <resistor name="R3" resistance="10k" footprint={footprintUrl} pcbX={5} />
    </board>,
  )
  const ended: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.effectName === "load-footprint-url") {
      ended.push(event.componentDisplayName!)
    }
  })
  const settled = circuit.renderUntilSettled()
  expect(requests).toHaveLength(3)
  const removedGroup = circuit.selectOne("group.pending")!
  const removedResistors = [...removedGroup.children]
  const priorChildren = removedResistors.map(
    (resistor) => resistor.children.length,
  )
  removedGroup.parent!.remove(removedGroup)
  expect(requests.map((request) => request.signal.aborted)).toEqual([
    true,
    true,
    false,
  ])
  requests[2].resolve(footprintResponse())
  await settled
  expect(removedResistors.map((resistor) => resistor.children.length)).toEqual(
    priorChildren,
  )
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.selectOne("resistor.R3")!.children.length).toBeGreaterThan(2)
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
  expect(ended).toHaveLength(3)
  expect(requests.every((request) => !request.hasAbortListener)).toBe(true)
})
