import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper pour with board outline", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="20mm"
      height="20mm"
      outline={[
        { x: -10, y: -10 },
        { x: 10, y: -10 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 0 },
        { x: -10, y: 0 },
      ]}
    >
      <net name="GND" />
      <net name="VCC" />
      <resistor
        name="R1"
        footprint="0805"
        resistance="10k"
        pcbX={-5}
        pcbY={-2}
        connections={{
          pin1: "net.GND",
          pin2: "net.VCC",
        }}
      />
      <resistor
        name="R2"
        footprint="0805"
        resistance="1k"
        pcbX={5}
        pcbY={-2}
        connections={{
          pin1: "net.VCC",
          pin2: "net.VCC",
        }}
      />
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-outline")
})

test("multiple copper pours on different layers", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <net name="GND" />
      <net name="VCC" />
      <resistor
        name="R1"
        footprint="0805"
        resistance="10k"
        pcbX={-5}
        connections={{
          pin2: "net.GND",
        }}
      />
      <resistor
        name="R2"
        footprint="0805"
        resistance="10k"
        pcbX={5}
        layer={"bottom"}
        connections={{
          pin2: "net.VCC",
        }}
      />
      <platedhole shape="circle" holeDiameter={1.2} outerDiameter={2.4} />
      <hole pcbY={-4} diameter={2} />
      <copperpour connectsTo="net.GND" layer="top" padMargin={0.4} />
      <copperpour connectsTo="net.VCC" layer="bottom" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-multiple-layers")
})

test("copper pour should avoid traces on different nets", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" autorouter="sequential-trace">
      <net name="GND" />
      <net name="VCC" />
      <resistor
        name="R1"
        footprint="0805"
        resistance="10k"
        pcbX={-5}
        connections={{
          pin1: "net.VCC",
        }}
      />
      <resistor
        name="R2"
        footprint="0805"
        resistance="1k"
        pcbX={5}
        connections={{ pin2: "net.GND" }}
      />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <copperpour connectsTo="net.GND" layer="top" padMargin={0.4} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-avoid-traces")
})

test("smaller trace margin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm">
      <chip name="U1" footprint="soic8" pcbX={-6} pcbY={0} />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={6} pcbY={4} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={6}
        pcbY={-4}
      />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".U1 > .pin4" to="net.GND" />
      <trace from=".U1 > .pin1" to="net.VCC" />
      <copperpour connectsTo="net.VCC" layer="top" traceMargin={0.1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-smaller-trace-margin")
})

test("bigger trace margin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm">
      <chip name="U1" footprint="soic8" pcbX={-6} pcbY={0} />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={6} pcbY={4} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={6}
        pcbY={-4}
      />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".U1 > .pin4" to="net.GND" />
      <trace from=".U1 > .pin1" to="net.VCC" />
      <copperpour connectsTo="net.VCC" layer="top" traceMargin={0.4} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "bigger-trace-margin")
})

test("respects board edge margin", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <net name="GND" />
      <copperpour connectsTo="net.GND" layer="top" boardEdgeMargin="2mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-board-edge-margin")
})

test("respects clearance prop", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm">
      <net name="GND" />
      <chip
        name="R1"
        footprint="soic4"
        pcbX={-5}
        connections={{
          pin2: "net.GND",
        }}
      />
      <copperpour connectsTo="net.GND" layer="top" clearance={0.1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-clearance")
})

test("cutouts and vias", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <net name="GND" />
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        connections={{
          pin2: "net.GND",
          pin1: "net.VCC",
        }}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        layer="bottom"
        connections={{
          pin1: "net.VCC",
        }}
      />
      <hole shape="circle" radius={1} pcbY={-3} />
      <cutout pcbX={3} shape="rect" width={2} height={1} />
      <cutout pcbX={3} pcbY={3} shape="circle" radius={1} />
      <cutout
        shape="polygon"
        points={[
          { x: "3", y: "-2" },
          { x: 3, y: -2 },
          { x: 4, y: -3 },
          { x: 2, y: -3 },
        ]}
      />
      <copperpour connectsTo="net.GND" layer={"top"} cutoutMargin="0.1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-cutouts-and-vias")
})

test("polygon board", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="30mm"
      height="20mm"
      outline={[
        { x: -13, y: 10 },
        { x: 13, y: 10 },
        { x: 15, y: 8 },
        { x: 15, y: -8 },
        { x: 13, y: -10 },
        { x: -13, y: -10 },
        { x: -15, y: -8 },
        { x: -15, y: 8 },
      ]}
    >
      <chip name="U1" footprint="soic8" pcbX={-6} pcbY={0} />
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={6} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={6}
        pcbY={-4}
      />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".U1 > .pin4" to="net.GND" />
      <copperpour connectsTo="net.GND" layer="top" clearance="0.3mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path + "-polygon-board")
})
