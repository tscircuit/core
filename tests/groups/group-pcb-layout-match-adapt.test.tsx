import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB matchAdapt falls back to packing on boards and nested groups", async () => {
  for (const nested of [false, true]) {
    for (const shorthand of [false, true]) {
      const { circuit } = getTestFixture()
      const layout = shorthand
        ? { matchAdapt: true }
        : { pcbLayout: { matchAdapt: true } }
      const parts = (
        <>
          <net name="V" />
          <net name="GND" />
          <resistor
            name="R1"
            resistance="1k"
            footprint="0805"
            connections={{ pin1: "net.V", pin2: "net.GND" }}
          />
          <resistor
            name="R2"
            resistance="1k"
            footprint="0805"
            connections={{ pin1: "net.V", pin2: "net.GND" }}
          />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0805"
            connections={{ pin1: "net.V", pin2: "net.GND" }}
          />
          <capacitor
            name="C2"
            capacitance="100nF"
            footprint="0805"
            connections={{ pin1: "net.V", pin2: "net.GND" }}
          />
          <resistor
            name="fixed"
            resistance="1k"
            footprint="0805"
            pcbX={12}
            pcbY={12}
          />
        </>
      )
      circuit.add(
        <board
          width={40}
          height={40}
          routingDisabled
          {...(nested ? {} : layout)}
        >
          {nested ? (
            <group pcbX={3} pcbY={4} {...layout}>
              {parts}
            </group>
          ) : (
            parts
          )}
          <pcbnotetext
            text="matchAdapt: packed R1, R2, C1, C2; fixed stays at (12,12)"
            pcbY={18}
            fontSize={0.7}
          />
        </board>,
      )
      await circuit.renderUntilSettled()
      const components = circuit.db.pcb_component.list()
      expect(components).toHaveLength(5)
      expect(
        new Set(components.map(({ center }) => `${center.x},${center.y}`)).size,
      ).toBe(5)
      expect(
        circuit
          .getCircuitJson()
          .filter((element) => element.type === "pcb_courtyard_overlap_error"),
      ).toHaveLength(0)
      const fixedSource = circuit.db.source_component
        .list()
        .find(({ name }) => name === "fixed")!
      const fixed = components.find(
        ({ source_component_id }) =>
          source_component_id === fixedSource.source_component_id,
      )!
      expect(fixed.center).toEqual(nested ? { x: 15, y: 16 } : { x: 12, y: 12 })
      if (!nested && !shorthand)
        expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
