import { expect, test } from "bun:test"
import {
  type AutoplacedJumper,
  insertAutoplacedJumpers,
} from "lib/components/primitive-components/Group/insert-autoplaced-jumpers"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autoplaced jumpers reject mixed source nets before changing the circuit", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled schematicDisabled>
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
  const { db } = circuit
  const { connMap } = getSimpleRouteJsonFromCircuitJson({ db })
  const vm = db.source_net.getWhere({ name: "VM" })!
  const gnd = db.source_net.getWhere({ name: "GND" })!
  const sourceTracesBefore = structuredClone(db.source_trace.list())
  const jumper: AutoplacedJumper = {
    jumper_footprint: "1206",
    center: { x: 0, y: 0 },
    orientation: "horizontal",
    width: 1,
    height: 2,
    pads: [
      {
        center: { x: 0, y: -0.5 },
        width: 0.5,
        height: 0.5,
        connectedTo: [vm.source_net_id, gnd.source_net_id],
      },
      {
        center: { x: 0, y: 0.5 },
        width: 0.5,
        height: 0.5,
        connectedTo: [vm.source_net_id],
      },
    ],
  }
  expect(() =>
    insertAutoplacedJumpers({ db, connMap, output_jumpers: [jumper] }),
  ).toThrow("Autorouter jumper would connect separate intended nets.")

  const validJumper: AutoplacedJumper = {
    ...jumper,
    pads: jumper.pads.map((pad) => ({
      ...pad,
      connectedTo: [vm.source_net_id],
    })),
  }
  expect(() =>
    insertAutoplacedJumpers({
      db,
      connMap,
      output_jumpers: [
        validJumper,
        {
          ...jumper,
          pads: [
            { ...jumper.pads[0], connectedTo: [vm.source_net_id] },
            { ...jumper.pads[1], connectedTo: [gnd.source_net_id] },
          ],
        },
      ],
    }),
  ).toThrow("Autorouter jumper would connect separate intended nets.")

  expect(db.source_trace.list()).toEqual(sourceTracesBefore)
  expect(db.source_component.list()).toHaveLength(2)
  expect(connMap.areIdsConnected(vm.source_net_id, gnd.source_net_id)).toBe(
    false,
  )
})
