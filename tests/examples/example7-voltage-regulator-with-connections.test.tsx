import { createUseComponent } from "lib/hooks/create-use-component"
import type { CommonLayoutProps } from "@tscircuit/props"
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { useCapacitor, useLed, useResistor } from "lib/index"

const pinLabels = {
  pin7: ["pin7", "EP"],
  pin6: ["pin6", "IN"],
  pin5: ["pin5", "PG"],
  pin4: ["pin4", "EN"],
  pin3: ["pin3", "GND"],
  pin2: ["pin2", "FB"],
  pin1: ["pin1", "OUT"],
} as const

interface Props extends CommonLayoutProps {
  name: string
}

const TPS74601PDRVR = (props: Props) => {
  return (
    <chip
      {...props}
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=c909123e4a7a4da5a0270979fee6c02c&pn=C2837407",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      pinLabels={pinLabels}
      schPinSpacing={0.75}
      supplierPartNumbers={{
        lcsc: ["C2837407"],
      }}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin7"]}
            pcbX="0mm"
            pcbY="0mm"
            width="1.5999967999999998mm"
            height="0.9999979999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.6500113999999968mm"
            pcbY="0.9751059999999967mm"
            width="0.39999919999999994mm"
            height="0.45001179999999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0mm"
            pcbY="0.9751059999999967mm"
            width="0.39999919999999994mm"
            height="0.45001179999999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.6500113999999968mm"
            pcbY="0.9751059999999967mm"
            width="0.39999919999999994mm"
            height="0.45001179999999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.6500113999999968mm"
            pcbY="-0.9751059999999967mm"
            width="0.39999919999999994mm"
            height="0.45001179999999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-0.9751059999999967mm"
            width="0.39999919999999994mm"
            height="0.45001179999999996mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.6500113999999968mm"
            pcbY="-0.9751059999999967mm"
            width="0.39999919999999994mm"
            height="0.45001179999999996mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -1.0500360000000057, y: -1.0490199999999987 },
              { x: -1.0500360000000057, y: 1.0500360000000057 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.0500359999999915, y: -1.0490199999999987 },
              { x: 1.0500359999999915, y: 1.0500360000000057 },
            ]}
          />
        </footprint>
      }
    />
  )
}

const useTPS74601PDRVR = createUseComponent(TPS74601PDRVR, pinLabels)

const Reg5vTo3v3 = (props: { name: string } & CommonLayoutProps) => {
  const PWR1 = useTPS74601PDRVR("PWR1")
  const R6 = useResistor("R6", { resistance: "1M", footprint: "0402" })
  const R7 = useResistor("R7", { resistance: "200k", footprint: "0402" })
  const R8 = useResistor("R8", { resistance: "1k", footprint: "0402" })
  const C6 = useCapacitor("C6", { footprint: "cap0805", capacitance: "10uF" })
  const C7 = useCapacitor("C7", { footprint: "cap0805", capacitance: "10uF" })
  const LED1 = useLed("LED1", { footprint: "0603" })

  return (
    <group {...props}>
      <PWR1
        pcbX={4}
        pcbRotation="90deg"
        EN="net.v5"
        EP="net.gnd"
        IN="net.v5"
        OUT="net.v3_3"
      />
      <R6 pcbX={7} pcbY={-0.5} pin1={PWR1.OUT} pcbRotation="180deg" schX={-3} />
      <R7 pcbX={6} pcbY={1} pcbRotation="90deg" schX={-3} schY={-2} />
      <R8
        pcbRotation="180deg"
        pcbX={7}
        pcbY={-3}
        pin1="net.v3_3"
        schX={-3}
        schY={2}
      />
      <C6 neg="net.gnd" pos="net.v5" schX={3} schY={-1.5} />
      <C7
        pcbRotation="180deg"
        pcbX={0}
        pcbY={-3}
        pos="net.v3_3"
        neg="net.gnd"
        schX={3}
      />
      <LED1 pcbX={4} pcbY={-3} neg="net.gnd" pos={R8.pin2} schX={4} schY={3} />

      <trace from={PWR1.FB} to={R6.pin2} />
      <trace from={PWR1.FB} to={R7.pin1} />
      <trace from={R7.pin2} to="net.gnd" />
      <trace from={PWR1.GND} to="net.gnd" />
      <trace from={C7.neg} to="net.gnd" />
      <trace from={C7.pos} to="net.v3_3" />
    </group>
  )
}

test("example7 voltage regulator with connections", async () => {
  const { circuit } = await getTestFixture()
  const U1 = useTPS74601PDRVR("U1")

  circuit.add(
    <board width="10mm" height="10mm">
      <Reg5vTo3v3 name="U1" />
    </board>,
  )

  circuit.render()

  // Get all schematic traces
  const traces = circuit.db.schematic_trace.list()

  // Get all junctions from traces
  const junctions = traces.flatMap((trace) => trace.junctions || [])

  // There should be at least one junction where traces intersect
  expect(junctions.length).toBeGreaterThan(0)

  // Each junction should have x,y coordinates
  for (const junction of junctions) {
    expect(junction).toHaveProperty("x")
    expect(junction).toHaveProperty("y")
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: {
      cellSize: 1,
      labelCells: true,
    },
    labeledPoints: junctions.map((a) => ({ ...a, label: "junction" })),
  })
})
