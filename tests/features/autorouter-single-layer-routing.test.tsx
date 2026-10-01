import { expect, test } from "bun:test"
import type { AutorouterProp } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("single_layer_routing routes identically to bus_lanes on boards and phases", async () => {
  const renderBus = async (
    autorouter: AutorouterProp,
    scope: "board" | "phase",
  ) => {
    const { circuit } = getTestFixture()
    const solverNames: string[] = []
    circuit.on("solver:started", ({ solverName }) =>
      solverNames.push(solverName),
    )
    circuit.add(
      <board
        width={14}
        height={10}
        autorouter={scope === "board" ? autorouter : "default"}
      >
        {scope === "phase" && (
          <autoroutingphase
            autorouter={autorouter}
            connections={["A0.pin2", "A1.pin2"]}
          />
        )}
        <resistor
          name="A0"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={-2}
        />
        <resistor
          name="B0"
          resistance="1k"
          footprint="0402"
          pcbX={4}
          pcbY={-2}
        />
        <resistor
          name="A1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbY={2}
        />
        <resistor
          name="B1"
          resistance="1k"
          footprint="0402"
          pcbX={3}
          pcbY={2}
        />
        <trace name="DATA0" from=".A0 > .pin2" to=".B0 > .pin1" />
        <trace name="DATA1" from=".A1 > .pin2" to=".B1 > .pin1" />
        <bus
          name="DATA"
          connections={["DATA0", "DATA1"]}
          maxLengthSkew="0.5mm"
          pcbTraceWidth="0.15mm"
        />
        <pcbnotetext
          pcbX={0}
          pcbY={-3.4}
          fontSize={0.28}
          text="single_layer_routing = bus_lanes"
        />
        <pcbnotetext
          pcbX={0}
          pcbY={-4.1}
          fontSize={0.28}
          text="Both routes: top layer, 0.15mm width, 0.5mm skew, no vias."
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const routes = json
      .filter((e) => e.type === "pcb_trace")
      .map((e) => e.route)
    expect(solverNames).toContain("BusLanesPipelineSolver")
    expect(routes).toHaveLength(2)
    expect(json.filter((e) => e.type === "pcb_via")).toHaveLength(0)
    expect(json.filter((e) => e.type === "pcb_autorouting_error")).toHaveLength(
      0,
    )
    return { circuit, routes }
  }

  for (const scope of ["board", "phase"] as const) {
    const canonical = await renderBus("bus_lanes", scope)
    for (const autorouter of [
      "single_layer_routing",
      { preset: "single_layer_routing" },
    ] as const) {
      const result = await renderBus(autorouter, scope)
      expect(result.routes).toEqual(canonical.routes)
    }
    if (scope === "phase") {
      expect(canonical.circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
