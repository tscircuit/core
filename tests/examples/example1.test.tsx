import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("example1", async () => {
  const { project } = getTestFixture()
  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "PWR", pin8: "GND" }}
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R1"
        footprint="0402"
        resistance="10k"
        pullupFor=".U1 port.2"
        pullupTo="net.5v"
        pcbX={4}
        pcbY={0}
        pcbRotation={90}
      />
      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0603"
        decouplingFor=".U1 port.PWR"
        decouplingTo="net.GND"
        pcbX={-5}
        pcbY={0}
        pcbRotation={90}
      />
      <jumper
        pcbRotation={90}
        pcbX={0}
        pcbY={-4}
        name="J1"
        footprint="pinrow4"
      />

      <trace from=".J1 pin.1" to=".U1 .PWR" />
      <trace from=".J1 pin.2" to=".U1 port.2" />
      <trace from=".J1 pin.3" to=".U1 port.3" />
      <trace from=".J1 pin.4" to=".U1 .GND" />
    </board>,
  )

  project.render()

  await expect(
    project.getSvg({
      view: "pcb",
      layer: "top",
    }),
  ).toMatchSvgSnapshot(import.meta.dir, "example1")
})
