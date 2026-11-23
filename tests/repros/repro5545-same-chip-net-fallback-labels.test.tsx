import { expect, test } from "bun:test"
import type { Group } from "lib/components"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { insertNetLabelsForPortsMissingTrace } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/insertNetLabelsForPortsMissingTrace"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keeps distinct fallback net labels for two adjacent pins of one chip on the same net", async () => {
  const { circuit } = getTestFixture()
  const sixteenPins = Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [`pin${i + 1}`, `P${i + 1}`]),
  )

  circuit.add(
    <board width="100mm" height="80mm" routingDisabled>
      <chip
        name="U1"
        footprint="dip8"
        pinLabels={{
          pin1: "OUTA",
          pin2: "INA_N",
          pin3: "INA_P",
          pin4: "VEE",
          pin5: "INB_P",
          pin6: "INB_N",
          pin7: "OUTB",
          pin8: "VCC",
        }}
        connections={{
          pin1: "net.TIE",
          pin2: "net.TIE",
          pin3: "net.VREF",
          pin4: "net.GND",
          pin5: "net.LV",
          pin6: "net.FB",
          pin7: "net.FX",
          pin8: "net.VP",
        }}
      />
      <chip
        name="U2"
        footprint="dip16"
        pinLabels={sixteenPins}
        connections={{ pin15: "net.FB", pin7: "net.K1", pin8: "net.K2" }}
      />
      <chip
        name="U3"
        footprint="dip16"
        pinLabels={sixteenPins}
        connections={{ pin15: "net.FB", pin7: "net.K3", pin8: "net.K4" }}
      />
      <resistor
        name="R1"
        resistance="18k"
        footprint="axial_p10.16mm"
        connections={{ pin1: "net.K2", pin2: "net.MID" }}
      />
      <capacitor
        name="C1"
        capacitance="22uF"
        polarized
        footprint="axial_p10.16mm"
        connections={{ pin1: "net.MID", pin2: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="1M"
        footprint="axial_p10.16mm"
        connections={{ pin1: "net.MID", pin2: "net.VREF" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const tieSourceNet = circuit.db.source_net
    .list()
    .find((net) => net.name === "TIE")!
  const u1 = circuit.db.source_component
    .list()
    .find((comp) => comp.name === "U1")!
  const u1Ports = circuit.db.source_port
    .list()
    .filter(
      (port) =>
        port.source_component_id === u1.source_component_id &&
        (port.pin_number === 1 || port.pin_number === 2),
    )
  const tieSchPorts = u1Ports.map(
    (sourcePort) =>
      circuit.db.schematic_port
        .list()
        .find((sp) => sp.source_port_id === sourcePort.source_port_id)!,
  )
  expect(tieSchPorts).toHaveLength(2)

  const tieLabels = circuit.db.schematic_net_label
    .list()
    .filter(
      (label) =>
        label.source_net_id === tieSourceNet.source_net_id &&
        label.text === "TIE",
    )

  expect(tieLabels).toHaveLength(2)
  for (const schPort of tieSchPorts) {
    expect(
      tieLabels.some(
        (label) =>
          Math.hypot(
            label.anchor_position!.x - schPort.center.x,
            label.anchor_position!.y - schPort.center.y,
          ) < 1e-3,
      ),
    ).toBe(true)
  }
})

test("inserts separate fallback net labels for adjacent same-chip pins without solver labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="30mm" routingDisabled>
      <chip
        name="U1"
        footprint="dip8"
        connections={{
          pin1: "net.TIE",
          pin2: "net.TIE",
          pin3: "net.GND",
          pin4: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.selectOne("chip")!.parent as Group<any>
  const {
    schematicPortIdsInScope,
    schematicPortIdsWithExternallyRoutedRepresentations,
    schPortIdToSourcePortId,
    connKeyToSourceNet,
  } = createSchematicTraceSolverInputProblem(board, {})

  for (const sp of circuit.db.schematic_port.list()) {
    circuit.db.schematic_port.update(sp.schematic_port_id, {
      is_connected: false,
    })
  }
  for (const nl of circuit.db.schematic_net_label.list()) {
    circuit.db.schematic_net_label.delete(nl.schematic_net_label_id)
  }

  insertNetLabelsForPortsMissingTrace({
    group: board,
    schematicPortIdsInScope,
    schematicPortIdsWithExternallyRoutedRepresentations,
    schPortIdToSourcePortId,
    connKeyToSourceNet,
  })

  const u1 = circuit.db.source_component
    .list()
    .find((comp) => comp.name === "U1")!
  const u1Ports = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === u1.source_component_id)

  for (const [netName, pinNames] of [
    ["TIE", ["pin1", "pin2"]],
    ["GND", ["pin3", "pin4"]],
  ] as const) {
    const net = circuit.db.source_net.list().find((n) => n.name === netName)!
    const labels = circuit.db.schematic_net_label
      .list()
      .filter((l) => l.source_net_id === net.source_net_id)
    expect(labels).toHaveLength(2)

    for (const pinName of pinNames) {
      const sourcePort = u1Ports.find((p) => p.name === pinName)!
      const schPort = circuit.db.schematic_port
        .list()
        .find((sp) => sp.source_port_id === sourcePort.source_port_id)!
      expect(
        labels.some(
          (l) =>
            Math.hypot(
              l.anchor_position!.x - schPort.center.x,
              l.anchor_position!.y - schPort.center.y,
            ) < 1e-3,
        ),
      ).toBe(true)
    }
  }
})
