import { expect, test } from "bun:test"
import { Circuit } from "lib/index"

test("manual pcbPath and pcbPaths emit full through-hole span when allowBlindAndBuriedVias is false", async () => {
  const path = [
    "R1.pin2",
    { x: 2, y: 0 },
    { x: 2, y: 0, via: true, fromLayer: "top", toLayer: "inner2" },
    { x: 2, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 0, via: true, fromLayer: "inner2", toLayer: "top" },
    { x: 6, y: 0 },
    "R2.pin1",
  ] as const

  for (const api of ["pcbPath", "pcbPaths"] as const) {
    const circuit = new Circuit()
    circuit.schematicDisabled = true
    circuit.add(
      <board
        width={20}
        height={12}
        layers={4}
        routeRemaining={false}
        allowBlindAndBuriedVias={false}
        pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.7 }}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <trace
          from="R1.pin2"
          to="R2.pin1"
          thickness={0.2}
          pcbPathRelativeTo="R1.pin2"
          {...(api === "pcbPath"
            ? { pcbPath: [...path] }
            : { pcbPaths: [[...path]] })}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(2)
    for (const via of vias) {
      expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
    }
  }
})

test("manual pcbPath and pcbPaths emit partial span when allowBlindAndBuriedVias is true", async () => {
  const path = [
    "R1.pin2",
    { x: 2, y: 0 },
    { x: 2, y: 0, via: true, fromLayer: "top", toLayer: "inner2" },
    { x: 2, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 0, via: true, fromLayer: "inner2", toLayer: "top" },
    { x: 6, y: 0 },
    "R2.pin1",
  ] as const

  for (const api of ["pcbPath", "pcbPaths"] as const) {
    const circuit = new Circuit()
    circuit.schematicDisabled = true
    circuit.add(
      <board
        width={20}
        height={12}
        layers={4}
        routeRemaining={false}
        allowBlindAndBuriedVias={true}
        pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.7 }}
      >
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={0}
        />
        <trace
          from="R1.pin2"
          to="R2.pin1"
          thickness={0.2}
          pcbPathRelativeTo="R1.pin2"
          {...(api === "pcbPath"
            ? { pcbPath: [...path] }
            : { pcbPaths: [[...path]] })}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const vias = circuit.db.pcb_via.list()
    expect(vias).toHaveLength(2)
    expect(vias[0].layers).toEqual(["top", "inner1", "inner2"])
    expect(vias[1].layers).toEqual(["inner2", "inner1", "top"])
  }
})
