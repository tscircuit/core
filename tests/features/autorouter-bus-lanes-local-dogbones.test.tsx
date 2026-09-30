import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus_lanes automatically dogbones both packages to the allowed signal layer", async () => {
  const { circuit } = getTestFixture()
  const footprint = (
    <footprint>
      {[0, 1, 2, 3].map((i) => (
        <smtpad
          portHints={[`pin${i + 1}`]}
          pcbX={(i % 2) * 0.8 - 0.4}
          pcbY={Math.floor(i / 2) * 0.8 - 0.4}
          shape="circle"
          radius={0.2}
        />
      ))}
    </footprint>
  )
  circuit.add(
    <board
      width={10}
      height={12}
      layers={4}
      minTraceWidth={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
      minTraceToPadEdgeClearance={0.1}
    >
      <autoroutingphase autorouter="bus_lanes" />
      <chip
        name="U1"
        footprint={footprint}
        pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "D" }}
        pcbY={3}
      />
      <chip
        name="U2"
        footprint={footprint}
        pinLabels={{ pin1: "A", pin2: "B", pin3: "C", pin4: "D" }}
        pcbY={-3}
      />
      <trace name="DATA0" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="DATA1" from=".U1 > .pin2" to=".U2 > .pin2" />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        pcbAllowedLayers={["inner1"]}
      />
      <pcbnotetext
        pcbY={5}
        fontSize={0.35}
        text="Automatic local dogbones: 4 through vias; inner1 lanes"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(json.filter((e) => e.type.endsWith("_error"))).toEqual([])
  expect(json.filter((e) => e.type === "pcb_via")).toHaveLength(4)
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
