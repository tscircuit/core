import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { createSchematicTraceSolverInputProblem } from "lib/components/primitive-components/Group/Group_doInitialSchematicTraceRender/createSchematicTraceSolverInputProblem"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { AO3400A } from "tests/fixtures/rp2040-temperature-alarm/AO3400A"
import { HYG_8503A } from "tests/fixtures/rp2040-temperature-alarm/HYG_8503A"

// imrishabh18/rp2040-motor-controller v1.0.42, position_alarm / Temperature Alarm.
// Original custom symbols and final schematic positions; other sections are
// represented only by their boundary nets. Coordinates are schematic world mm
// (+X right, +Y up). Q_BUZZER's long drain stem ends beside BZ1._NEG.
test("Temperature Alarm connects the actual custom buzzer bottom port", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board>
      <schematictext
        text="Temperature Alarm"
        schX={7}
        schY={0.8}
        anchor="left"
        fontSize={0.18}
      />
      <HYG_8503A
        name="BZ1"
        schX={12.27}
        schY={-1.54}
        noConnect={["NC1", "NC2"]}
      />
      <AO3400A name="Q_BUZZER" schX={11.55} schY={-2.74} />
      <diode name="D_BUZZER" schRotation={90} schX={9.4} schY={-0.52} />
      <resistor
        name="R_BUZZER_GATE"
        resistance="100"
        schRotation={270}
        schX={8.13}
        schY={-2.44}
      />
      <resistor
        name="R_BUZZER_PD"
        resistance="100k"
        schRotation={270}
        schX={8.92}
        schY={-4.44}
      />
      <net name="V3V3" />
      <net name="GND" />
      <trace from=".R_BUZZER_GATE > .pin1" to="net.BUZZER_PWM" />
      <trace
        name="BUZZER_GATE"
        from=".R_BUZZER_GATE > .pin2"
        to=".Q_BUZZER > .G"
      />
      <trace
        name="BUZZER_OFF"
        from=".Q_BUZZER > .G"
        to=".R_BUZZER_PD > .pin1"
      />
      <trace from=".R_BUZZER_PD > .pin2" to="net.GND" />
      <trace from=".Q_BUZZER > .S" to="net.GND" />
      <trace
        name="BUZZER_SINK"
        schDisplayLabel="BUZZER_SINK"
        from=".Q_BUZZER > .D"
        to=".BZ1 > ._NEG"
      />
      <trace from=".BZ1 > ._POS" to="net.V3V3" />
      <trace
        name="BUZZER_FLYBACK_A"
        schDisplayLabel="BUZZER_SINK"
        from=".D_BUZZER > .anode"
        to=".Q_BUZZER > .D"
      />
      <trace
        name="BUZZER_FLYBACK_K"
        from=".D_BUZZER > .cathode"
        to=".BZ1 > ._POS"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const { inputProblem } = createSchematicTraceSolverInputProblem(
    circuit.firstChild as Group,
  )
  const customChips = inputProblem.chips.filter((chip) => {
    const component = circuit.db.schematic_component.get(chip.chipId)!
    return ["BZ1", "Q_BUZZER"].includes(
      circuit.db.source_component.get(component.source_component_id!)!.name,
    )
  })
  expect(customChips).toHaveLength(2)
  for (const chip of customChips) {
    const schematicComponent = circuit.db.schematic_component.get(chip.chipId)!
    expect(chip.center).toEqual(schematicComponent.center)
    expect(chip.width).toBeCloseTo(schematicComponent.size.width)
    expect(chip.height).toBeCloseTo(schematicComponent.size.height)
  }

  const buzzerSource = circuit.db.source_component.getWhere({ name: "BZ1" })!
  const transistorSource = circuit.db.source_component.getWhere({
    name: "Q_BUZZER",
  })!
  const buzzerPort = circuit.db.source_port.getWhere({
    source_component_id: buzzerSource.source_component_id,
    name: "_NEG",
  })!
  const drainPort = circuit.db.source_port.getWhere({
    source_component_id: transistorSource.source_component_id,
    name: "D",
  })!
  const buzzerSchematicPort = circuit.db.schematic_port.getWhere({
    source_port_id: buzzerPort.source_port_id,
  })!
  const drainSchematicPort = circuit.db.schematic_port.getWhere({
    source_port_id: drainPort.source_port_id,
  })!
  const closeToPort = (
    point: { x: number; y: number },
    port: typeof buzzerSchematicPort,
  ) => Math.hypot(point.x - port.center.x, point.y - port.center.y) < 1e-8
  const buzzerTrace = circuit.db.schematic_trace.list().find((trace) => {
    const endpoints = trace.edges.flatMap((edge) => [edge.from, edge.to])
    return [buzzerSchematicPort, drainSchematicPort].every((port) =>
      endpoints.some((point) => closeToPort(point, port)),
    )
  })
  expect(buzzerTrace).toBeDefined()
  for (const edge of buzzerTrace!.edges) {
    expect(
      Math.abs(edge.from.x - edge.to.x) < 1e-8 ||
        Math.abs(edge.from.y - edge.to.y) < 1e-8,
    ).toBe(true)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path, { grid: false })
})
