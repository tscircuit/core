import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reduced from astra/pd-power-supply v1.0.3. Keep the custom symbol's
// text and asymmetric body: including text in the bounds puts the drain inside
// the routing box. PR #4130 excludes text; this guards the three-pin case.
// All positions are schematic-world points in mm (+X right, +Y up).
test("custom MOSFET drain trace reaches the actual port", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board width={10} height={10} schLayout={{ layoutMode: "none" }}>
      <chip
        name="Q_CFG1"
        schX={0}
        schY={0}
        pinLabels={{ pin1: ["G"], pin2: ["S"], pin3: ["D"] }}
        symbol={
          <symbol>
            <schematictext
              text={"Q_CFG1"}
              schX={0.4}
              schY={0.55}
              anchor="left"
              fontSize={0.18}
            />
            <schematictext
              text="2N7002"
              schX={0.4}
              schY={0.3}
              anchor="left"
              fontSize={0.16}
            />
            <schematicpath
              points={[
                { x: -0.4, y: 0 },
                { x: -0.4, y: -0.22 },
                { x: -0.4, y: -0.3 },
                { x: -0.4, y: -0.34 },
                { x: 0, y: -0.34 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.34, y: -0.28 },
                { x: -0.36, y: -0.3 },
                { x: -0.44, y: -0.3 },
                { x: -0.46, y: -0.32 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.4, y: -0.3 },
                { x: -0.34, y: -0.2 },
                { x: -0.46, y: -0.2 },
                { x: -0.4, y: -0.3 },
              ]}
              strokeColor="#880000"
              isFilled
              fillColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.46, y: -0.08 },
                { x: -0.44, y: -0.06 },
                { x: -0.36, y: -0.06 },
                { x: -0.34, y: -0.04 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.4, y: -0.06 },
                { x: -0.46, y: -0.16 },
                { x: -0.34, y: -0.16 },
                { x: -0.4, y: -0.06 },
              ]}
              strokeColor="#880000"
              isFilled
              fillColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.2, y: 0 },
                { x: -0.08, y: -0.04 },
                { x: -0.08, y: 0.04 },
                { x: -0.2, y: 0 },
              ]}
              strokeColor="#880000"
              isFilled
              fillColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0.2, y: 0.04 },
                { x: 0.14, y: -0.06 },
                { x: 0.26, y: -0.06 },
                { x: 0.2, y: 0.04 },
              ]}
              strokeColor="#880000"
              isFilled
              fillColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0, y: -0.2 },
                { x: 0.2, y: -0.2 },
                { x: 0.2, y: -0.04 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0, y: 0.14 },
                { x: 0, y: 0.2 },
                { x: 0.2, y: 0.2 },
                { x: 0.2, y: 0 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0, y: 0.14 },
                { x: -0.2, y: 0.14 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.2, y: 0 },
                { x: 0, y: 0 },
                { x: 0, y: -0.2 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0, y: -0.14 },
                { x: -0.2, y: -0.14 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.24, y: 0.18 },
                { x: -0.24, y: -0.18 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.2, y: 0.1 },
                { x: -0.2, y: 0.18 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.2, y: -0.04 },
                { x: -0.2, y: 0.04 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.2, y: -0.18 },
                { x: -0.2, y: -0.1 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: -0.4, y: 0 },
                { x: -0.24, y: 0 },
              ]}
              strokeColor="#880000"
            />
            <schematicpath
              points={[
                { x: 0.14, y: 0.04 },
                { x: 0.16, y: 0.04 },
                { x: 0.24, y: 0.04 },
                { x: 0.26, y: 0.04 },
              ]}
              strokeColor="#880000"
            />
            <port
              name="pin3"
              pinNumber={3}
              aliases={["D"]}
              direction="up"
              schX={0}
              schY={0.4}
              schStemLength={0.2}
            />
            <port
              name="pin1"
              pinNumber={1}
              aliases={["G"]}
              direction="left"
              schX={-0.6}
              schY={0}
              schStemLength={0.2}
            />
            <port
              name="pin2"
              pinNumber={2}
              aliases={["S"]}
              direction="down"
              schX={0}
              schY={-0.4}
              schStemLength={0.2}
            />
          </symbol>
        }
        connections={{ D: "net.CFG1", S: "net.GND", G: "net.CFG_DRIVE1" }}
      />
      <resistor
        name="R_CFG1"
        resistance="10k"
        schX={0}
        schY={2}
        schRotation={90}
        connections={{ pin1: "net.CFG1", pin2: "net.PD_VDD" }}
      />
      <resistor
        name="R_GATE1"
        resistance="100k"
        schX={-2}
        schY={-0.5}
        schRotation={90}
        connections={{ pin1: "net.GND", pin2: "net.CFG_DRIVE1" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const transistor = circuit.db.source_component
    .list()
    .find((c) => c.name === "Q_CFG1")!
  const drain = circuit.db.source_port
    .list()
    .find(
      (p) =>
        p.source_component_id === transistor.source_component_id &&
        p.port_hints?.includes("D"),
    )!
  const resistor = circuit.db.source_component
    .list()
    .find((c) => c.name === "R_CFG1")!
  const pullupPin = circuit.db.source_port
    .list()
    .find(
      (p) =>
        p.source_component_id === resistor.source_component_id &&
        p.pin_number === 1,
    )!
  expect(drain.subcircuit_connectivity_map_key).toBeDefined()
  expect(drain.subcircuit_connectivity_map_key).toBe(
    pullupPin.subcircuit_connectivity_map_key,
  )

  const drainPort = circuit.db.schematic_port
    .list()
    .find((p) => p.source_port_id === drain.source_port_id)!
  const drainNetTraces = circuit.db.schematic_trace
    .list()
    .filter(
      (t) =>
        t.subcircuit_connectivity_map_key ===
        drain.subcircuit_connectivity_map_key,
    )
  expect(drainNetTraces.length).toBeGreaterThan(0)
  // Desired behavior: a green wire must meet the real red pin stem, not just
  // the projected port on the solver's expanded bounding box.
  const wireReachesDrain = drainNetTraces.some((t) =>
    t.edges.some((e) =>
      [e.from, e.to].some(
        (p) =>
          Math.hypot(p.x - drainPort.center.x, p.y - drainPort.center.y) < 1e-6,
      ),
    ),
  )
  expect(wireReachesDrain).toBe(true)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
