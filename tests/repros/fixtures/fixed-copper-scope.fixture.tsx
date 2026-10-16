import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Positions are circuit-world points in mm: +X right, +Y up.
export default function FixedCopperScopeCircuit() {
  return (
    <board width={14} height={10} layers={2}>
      <testpoint
        name="PWR_L"
        footprintVariant="pad"
        layer="top"
        pcbX={-4}
        pcbY={0}
        padDiameter={0.8}
      />
      <testpoint
        name="PWR_R"
        footprintVariant="pad"
        layer="top"
        pcbX={4}
        pcbY={0}
        padDiameter={0.8}
      />
      <trace
        from="PWR_L.pin1"
        to="PWR_R.pin1"
        thickness={0.8}
        pcbPath={["PWR_L.pin1", "PWR_R.pin1"]}
      />
      <testpoint
        name="SIG_A"
        footprintVariant="pad"
        layer="top"
        pcbX={0}
        pcbY={2.5}
        padDiameter={0.6}
      />
      <testpoint
        name="SIG_B"
        footprintVariant="pad"
        layer="top"
        pcbX={0}
        pcbY={-2.5}
        padDiameter={0.6}
      />
      <trace from="SIG_A.pin1" to="SIG_B.pin1" thickness={0.2} />
      <pcbnotetext
        pcbY={4.4}
        fontSize={0.45}
        text="Next routing phase must preserve fixed POWER copper"
      />
      <pcbnotetext
        pcbY={-4.3}
        fontSize={0.35}
        text="Red = TOP copper | Blue = BOTTOM copper | Circles = vias"
      />
      <pcbnotetext
        pcbX={-3}
        pcbY={2.4}
        fontSize={0.35}
        text="POWER = fixed 0.8 mm"
      />
    </board>
  )
}

export async function getFixedCopperScopeFixture() {
  const { circuit } = getTestFixture()
  circuit.pcbRoutingDisabled = true
  circuit.add(<FixedCopperScopeCircuit />)
  await circuit.renderUntilSettled()
  const power = circuit.db.pcb_trace.list()[0]!
  const signal = circuit.db.source_trace
    .list()
    .find((trace) => trace.source_trace_id !== power.source_trace_id)!
  // Reproduce the imported phase output from the report: only optional physical
  // scope is missing. The source ownership and all emitted copper stay intact.
  const imported = circuit
    .getCircuitJson()
    .map((element) =>
      element.type === "pcb_trace"
        ? { ...element, subcircuit_id: undefined }
        : element,
    )
  return {
    circuit,
    power,
    signal,
    imported,
    subcircuitId: power.subcircuit_id!,
  }
}
