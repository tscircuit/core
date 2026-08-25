import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getWireWidths = (circuit: any): number[] =>
  circuit.db.pcb_trace
    .list()
    .flatMap((t: any) =>
      t.route
        .filter((p: any) => p.route_type === "wire")
        .map((p: any) => p.width),
    )

test("net nominalTraceWidth sets autorouted trace width", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <net name="VBUS" nominalTraceWidth="0.5mm" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to="net.VBUS" />
      <trace from=".R2 > .pin1" to="net.VBUS" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.5)
  }
})

test("explicit trace thickness takes precedence over net nominalTraceWidth", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <net name="VBUS" nominalTraceWidth="0.5mm" />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to="net.VBUS" thickness="0.2mm" />
      <trace from=".R2 > .pin1" to="net.VBUS" thickness="0.2mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.2)
  }
})

test("group nominalTraceWidth sets autorouted trace width", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <group nominalTraceWidth="0.4mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.4)
  }
})

test("innermost group nominalTraceWidth wins over the board's", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" nominalTraceWidth="0.2mm">
      <group nominalTraceWidth="0.4mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.4)
  }
})

test("net nominalTraceWidth wins over the enclosing group's", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <net name="VBUS" nominalTraceWidth="0.5mm" />
      <group nominalTraceWidth="0.2mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={0}
        />
        <trace from=".R1 > .pin2" to="net.VBUS" />
        <trace from=".R2 > .pin1" to="net.VBUS" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const widths = getWireWidths(circuit)
  expect(widths.length).toBeGreaterThan(0)
  for (const width of widths) {
    expect(width).toBe(0.5)
  }
})
