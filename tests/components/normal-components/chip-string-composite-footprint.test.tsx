import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprinter strings infer internally connected terminals for repeated pin numbers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={25} height={20} autorouter="auto-local">
      <chip
        name="Q1"
        footprint="smtpad_w1mm_h1mm"
        pinLabels={{ pin1: "DRAIN" }}
        schPinArrangement={{
          leftSide: { pins: [1], direction: "top-to-bottom" },
        }}
        connections={{ DRAIN: "net.DRAIN" }}
      >
        <smtpad
          shape="rect"
          portHints={["pin1"]}
          pcbX={4}
          pcbY={0}
          width={1}
          height={1}
        />
      </chip>
      <pinheader
        name="J_DRAIN"
        pinCount={1}
        pcbX={8}
        pcbY={6}
        schX={3}
        connections={{ pin1: "net.DRAIN" }}
      />
      <net name="DRAIN" />
      <pcbnotetext
        pcbY={-7}
        text="String footprint + separate pad share pin 1"
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceComponent = circuit.db.source_component.getWhere({ name: "Q1" })!
  const sourcePorts = circuit.db.source_port.list({
    source_component_id: sourceComponent.source_component_id,
  })
  expect(sourcePorts.map((port) => port.name)).toEqual([
    "DRAIN",
    "pin1_internal_1",
  ])
  const pcbComponent = circuit.db.pcb_component.getWhere({
    source_component_id: sourceComponent.source_component_id,
  })!
  const pads = circuit.db.pcb_smtpad.list({
    pcb_component_id: pcbComponent.pcb_component_id,
  })
  expect(pads).toHaveLength(2)
  const connectivity = getFullConnectivityMapFromCircuitJson(
    circuit.getCircuitJson(),
  )
  const drainNet = circuit.db.source_net.getWhere({ name: "DRAIN" })!
  const drainPorts = sourcePorts.filter(
    (port) => port.name === "DRAIN" || port.name === "pin1_internal_1",
  )
  expect(drainPorts).toHaveLength(2)
  for (const sourcePort of drainPorts) {
    const pcbPort = circuit.db.pcb_port.getWhere({
      source_port_id: sourcePort.source_port_id,
    })!
    expect(
      pads.filter((pad) => pad.pcb_port_id === pcbPort.pcb_port_id),
    ).toHaveLength(1)
    expect(connectivity.getNetConnectedToId(sourcePort.source_port_id)).toBe(
      connectivity.getNetConnectedToId(drainNet.source_net_id),
    )
  }
  expect(circuit.db.source_ambiguous_port_reference.list()).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
}, 30000)
