import { expect, test } from "bun:test"
import type { SourceTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a bad jumper in a later routing phase cannot change desired connectivity", async () => {
  const { circuit } = getTestFixture()
  let phaseCount = 0
  let sourceTracesBeforeRouting: SourceTrace[] = []
  const algorithmFn = async (simpleRouteJson: SimpleRouteJson) => {
    const autorouter = await createBasicAutorouter(async () => [])(
      simpleRouteJson,
    )
    const vm = circuit.db.source_net.getWhere({ name: "VM" })!
    const gnd = circuit.db.source_net.getWhere({ name: "GND" })!
    const connectedTo = [vm.source_net_id]
    phaseCount++
    if (phaseCount === 2) connectedTo.push(gnd.source_net_id)
    return {
      ...autorouter,
      solver: {
        getOutputJumpers: () => [
          {
            jumper_footprint: "1206",
            center: { x: 0, y: 0 },
            orientation: "horizontal",
            pads: [
              {
                center: { x: 0, y: -0.5 },
                width: 0.5,
                height: 0.5,
                connectedTo,
              },
              {
                center: { x: 0, y: 0.5 },
                width: 0.5,
                height: 0.5,
                connectedTo: [vm.source_net_id],
              },
            ],
          },
        ],
      },
    }
  }
  circuit.on("autorouting:start", ({ routingPhaseIndex }) => {
    if (routingPhaseIndex === 0) {
      sourceTracesBeforeRouting = structuredClone(
        circuit.db.source_trace.list(),
      )
    }
  })
  circuit.add(
    <board width={12} height={8} schematicDisabled autorouter={{ algorithmFn }}>
      <net name="VM" routingPhaseIndex={0} />
      <net name="GND" routingPhaseIndex={1} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-3}
        connections={{ pin1: "net.VM", pin2: "net.GND" }}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0603"
        pcbX={3}
        connections={{ pin1: "net.VM", pin2: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(phaseCount).toBe(2)
  expect(circuit.db.pcb_autorouting_error.list()).toContainEqual(
    expect.objectContaining({
      message: "Autorouter jumper would connect separate intended nets.",
    }),
  )
  expect(circuit.db.source_trace.list()).toEqual(sourceTracesBeforeRouting)
  expect(circuit.db.source_component.list()).toHaveLength(2)
})
