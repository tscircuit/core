import { test, expect } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { Circuit } from "lib/Circuit"
// this test needs core update and  PR to support net symbols
test("schematic net symbol", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="22mm" height="22mm">
      <resistor name="R1" resistance="10k" footprint="0402" schX={3} schY={0} />
      <resistor
        name="R2"
        schX={-2}
        schY={3}
        resistance="10k"
        footprint="0402"
        schRotation={90}
      />
      <resistor
        name="R3"
        schX={0}
        schY={3}
        resistance="10k"
        footprint="0402"
        schRotation={90}
      />
      <chip
        name="U1"
        schX={5}
        schY={3}
        schPortArrangement={{
          topSide: {
            direction: "left-to-right",
            pins: [
              "pin1",
              "pin2",
              "pin3",
              "pin4",
              "pin5",
              "pin6",
              "pin7",
              "pin8",
            ],
          },
          bottomSide: {
            direction: "left-to-right",
            pins: [
              "pin9",
              "pin10",
              "pin11",
              "pin12",
              "pin13",
              "pin14",
              "pin15",
              "pin16",
            ],
          },
          leftSide: {
            direction: "top-to-bottom",
            pins: [
              "pin17",
              "pin18",
              "pin19",
              "pin20",
              "pin21",
              "pin22",
              "pin23",
              "pin24",
            ],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: [
              "pin25",
              "pin26",
              "pin27",
              "pin28",
              "pin29",
              "pin30",
              "pin31",
              "pin32",
            ],
          },
        }}
      />
      <trace schDisplayLabel="GND3" from=".R1 > .pin1" to=".R2 > .pin2" />
      <trace schDisplayLabel="GND1" from=".R3 > .pin1" to=".R2 > .pin1" />
      <trace schDisplayLabel="GND1" from=".R3 > .pin2" to=".R2 > .pin1" />
      <trace schDisplayLabel="GND2" from=".U1 > .pin1" to=".R1 > .pin2" />
      <trace schDisplayLabel="GND2" from=".U1 > .pin13" to=".R1 > .pin2" />
      <trace schDisplayLabel="GND2" from=".U1 > .pin20" to=".R1 > .pin2" />
      <trace schDisplayLabel="GND2" from=".U1 > .pin28" to=".R1 > .pin2" />
      <trace from=".U1 > .pin4" to=".R1 > .pin2" />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
