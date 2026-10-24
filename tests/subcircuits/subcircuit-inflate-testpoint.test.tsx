import { expect, test } from "bun:test"
import type {
  CircuitJson,
  PcbPlatedHole,
  PcbSmtPad,
  SourceSimpleTestPoint,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("testpoint circular pad should inflate from circuitJson", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padShape="circle"
        padDiameter={1.2}
        pcbX={2}
        pcbY={3}
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()
  const sourceJson = sourceCircuit.getCircuitJson()

  const sourceTp = sourceJson.find(
    (elm) =>
      elm.type === "source_component" && elm.ftype === "simple_test_point",
  ) as SourceSimpleTestPoint
  expect(sourceTp).toBeDefined()
  expect(sourceTp.name).toBe("TP1")

  // Inflate in a new board using circuitJson
  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board
      width="20mm"
      height="20mm"
      routingDisabled
      circuitJson={sourceJson as CircuitJson}
    />,
  )

  await targetCircuit.renderUntilSettled()
  const targetJson = targetCircuit.getCircuitJson()

  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  const targetTp = targetJson.find(
    (elm) =>
      elm.type === "source_component" && elm.ftype === "simple_test_point",
  ) as SourceSimpleTestPoint
  expect(targetTp).toBeDefined()
  expect(targetTp.name).toBe("TP1")

  const targetSmtPad = targetJson.find(
    (elm) => elm.type === "pcb_smtpad",
  ) as PcbSmtPad
  expect(targetSmtPad).toBeDefined()
  expect(targetSmtPad.shape).toBe("circle")
})

test("testpoint rectangular pad should inflate from circuitJson", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <testpoint
        name="TP2"
        footprintVariant="pad"
        padShape="rect"
        width={1.5}
        height={2.5}
        pcbX={-2}
        pcbY={-3}
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()
  const sourceJson = sourceCircuit.getCircuitJson()

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board
      width="20mm"
      height="20mm"
      routingDisabled
      circuitJson={sourceJson as CircuitJson}
    />,
  )

  await targetCircuit.renderUntilSettled()
  const targetJson = targetCircuit.getCircuitJson()

  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  const targetTp = targetJson.find(
    (elm) =>
      elm.type === "source_component" && elm.ftype === "simple_test_point",
  ) as SourceSimpleTestPoint
  expect(targetTp).toBeDefined()
  expect(targetTp.name).toBe("TP2")

  const targetSmtPad = targetJson.find(
    (elm) => elm.type === "pcb_smtpad",
  ) as PcbSmtPad
  expect(targetSmtPad).toBeDefined()
  expect(targetSmtPad.shape).toBe("rect")
  if (targetSmtPad.shape === "rect") {
    expect(targetSmtPad.width).toBe(1.5)
    expect(targetSmtPad.height).toBe(2.5)
  }
})

test("testpoint through-hole should inflate from circuitJson", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <testpoint
        name="TP3"
        footprintVariant="through_hole"
        holeDiameter={0.8}
        pcbX={1}
        pcbY={1}
      />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()
  const sourceJson = sourceCircuit.getCircuitJson()

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board
      width="20mm"
      height="20mm"
      routingDisabled
      circuitJson={sourceJson as CircuitJson}
    />,
  )

  await targetCircuit.renderUntilSettled()
  const targetJson = targetCircuit.getCircuitJson()

  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  const targetTpHole = targetJson.find(
    (elm) => elm.type === "pcb_plated_hole",
  ) as PcbPlatedHole
  expect(targetTpHole).toBeDefined()
  if (targetTpHole.shape === "circle") {
    expect(targetTpHole.hole_diameter).toBe(0.8)
  }
})

test("connected testpoint with trace should inflate from circuitJson", async () => {
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <testpoint
        name="TP4"
        footprintVariant="pad"
        padShape="circle"
        padDiameter={1.2}
        pcbX={4}
        pcbY={0}
      />
      <trace from=".R1 > .pin2" to=".TP4 > .pin1" />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()
  const sourceJson = sourceCircuit.getCircuitJson()

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board
      width="20mm"
      height="20mm"
      circuitJson={sourceJson as CircuitJson}
    />,
  )

  await targetCircuit.renderUntilSettled()
  const targetJson = targetCircuit.getCircuitJson()

  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  const targetTp = targetJson.find(
    (elm) =>
      elm.type === "source_component" &&
      elm.ftype === "simple_test_point" &&
      elm.name === "TP4",
  )
  expect(targetTp).toBeDefined()
})
