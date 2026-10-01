import { expect, test } from "bun:test"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reduced from the metal-touch panel's printed inductive sensor.
// Footprint-local points in mm, +X right, +Y up (right-handed PCB frame).
const coilRoute = [
  { x: -5, y: -6 },
  { x: -5, y: -5 },
  { x: 5, y: -5 },
  { x: 5, y: 5 },
  { x: -5, y: 5 },
  { x: -5, y: -4 },
  { x: 4, y: -4 },
  { x: 4, y: 4 },
  { x: -4, y: 4 },
  { x: -4, y: -3 },
  { x: 3, y: -3 },
  { x: 3, y: 3 },
  { x: -3, y: 3 },
  { x: -3, y: -2 },
]

test("printed coil obstacles cover copper width and end caps", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={26} height={20} layers={2} autorouter="auto_local">
      <inductor
        name="L1"
        inductance="1uH"
        doNotPlace
        pcbX={2}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX={-5}
              pcbY={-6}
              holeDiameter={0.3}
              outerDiameter={0.8}
              shape="circle"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX={-3}
              pcbY={-2}
              holeDiameter={0.3}
              outerDiameter={0.8}
              shape="circle"
            />
            <pcbtrace
              route={coilRoute.map((point) => ({
                ...point,
                route_type: "wire" as const,
                width: 0.5,
                layer: "top" as const,
              }))}
            />
          </footprint>
        }
      />
      <capacitor
        name="C1"
        capacitance="1nF"
        footprint="0603"
        layer="bottom"
        pcbX={-7}
        pcbY={1}
      />
      <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={-7} pcbY={-4} />
      <trace from="L1.pin1" to="C1.pin1" />
      <trace from="L1.pin2" to="C1.pin2" />
      <trace from="J1.pin1" to="C1.pin1" />
      <trace from="J1.pin2" to="C1.pin2" />
      <fabricationnotetext
        text="FIXED: router obstacle covers the full copper"
        pcbY={8}
        fontSize={0.55}
        color="#ffffff"
      />
      <fabricationnotetext
        text="Red = real copper   /   Green = generated obstacle"
        pcbY={7}
        fontSize={0.45}
        color="#ffffff"
      />
      {/* Board-world mm, +X right, +Y up. These notes overlay the
            upper 10 mm coil segment; emitted geometry is checked below. */}
      <fabricationnoterect
        pcbX={2}
        pcbY={5}
        width={10.5}
        height={0.5}
        strokeWidth={0.03}
        hasStroke
        color="#00ff88"
      />
      <fabricationnotedimension
        from={{ x: 9.5, y: 4.75 }}
        to={{ x: 9.5, y: 5.25 }}
        text="0.5 mm copper"
        fontSize={0.4}
        arrowSize={0.15}
        color="#ffffff"
      />
      <fabricationnotepath
        route={[
          { x: 7, y: 4.75 },
          { x: 9.8, y: 4.75 },
        ]}
        strokeWidth={0.025}
        color="#ffffff"
      />
      <fabricationnotepath
        route={[
          { x: 7, y: 5.25 },
          { x: 9.8, y: 5.25 },
        ]}
        strokeWidth={0.025}
        color="#ffffff"
      />
      <fabricationnotedimension
        from={{ x: -3.25, y: 5.6 }}
        to={{ x: 7.25, y: 5.6 }}
        offset={1}
        text="10.5 mm obstacle (green)"
        fontSize={0.4}
        arrowSize={0.25}
        color="#00ff88"
      />
      <fabricationnotetext
        text="ACTUAL obstacle: 10.5 x 0.5 mm"
        pcbY={-7}
        fontSize={0.55}
        color="#00ff88"
      />
      <fabricationnotetext
        text="REQUIRED coverage: 10.5 x 0.5 mm (including caps)"
        pcbY={-8}
        fontSize={0.45}
        color="#ffffff"
      />
      <fabricationnotetext
        text="Full wire width and both round caps are protected"
        pcbY={-9}
        fontSize={0.45}
        color="#ffbb55"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const coil = circuit.selectOne(".L1")!
  const coilTrace = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.pcb_component_id === coil.pcb_component_id)!
  const obstacles = getObstaclesFromCircuitJson([coilTrace])
  // Verify the fabrication outline against the emitted obstacle geometry.
  expect(coilTrace.route[3]).toMatchObject({ width: 0.5 })
  expect(obstacles[3]).toMatchObject({
    center: { x: 2, y: 5 },
    width: 10.5,
    height: 0.5,
  })
  // Keep this a normal test: a render/snapshot failure must fail the repro.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
