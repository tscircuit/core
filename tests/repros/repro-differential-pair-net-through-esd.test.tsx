import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("differential pair over nets through an ESD chip builds a three-pad routing input", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => inputs.push(event.simpleRouteJson))
  const usb = { DP: "net.USB_DP", DM: "net.USB_DM" }

  circuit.add(
    <board width={18} height={10} schematicDisabled>
      <connector
        name="J1"
        footprint="usbmicro"
        pcbX={-6}
        pcbRotation={270}
        pinLabels={{ pin2: "DM", pin3: "DP" }}
        connections={usb}
      />
      <chip
        name="ESD"
        footprint="sot23"
        pinLabels={{ pin1: "DM", pin2: "DP" }}
        connections={usb}
      />
      <chip
        name="MCU"
        footprint="soic8"
        pcbX={6}
        pinLabels={{ pin2: "DM", pin3: "DP" }}
        connections={usb}
      />
      <differentialpair
        positiveConnection="net.USB_DP"
        negativeConnection="net.USB_DM"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(inputs).toHaveLength(1)
  expect(inputs[0].differentialPairs).toEqual([
    {
      connectionNames: [
        circuit.db.source_net.getWhere({ name: "USB_DP" })!.source_net_id,
        circuit.db.source_net.getWhere({ name: "USB_DM" })!.source_net_id,
      ],
      lengthTolerance: 0.1,
    },
  ])
  expect(inputs[0].connections).toHaveLength(2)
  for (const connection of inputs[0].connections) {
    expect(
      connection.pointsToConnect
        .map((point) => point.port_selector?.split(".")[0])
        .sort(),
    ).toEqual(["ESD", "J1", "MCU"])
  }
  expect(circuit.db.source_property_ignored_warning.list()).toEqual([])
  expect(circuit.db.source_bus.list()).toHaveLength(1)
})
