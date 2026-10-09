import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard } from "tests/fixtures/pcb-noise-board"

test("noise configuration rejects unresolved local models and duplicate names", async () => {
  for (const invalid of [
    "duplicate_port",
    "unknown_source_port",
    "unknown_observation_port",
    "unknown_baseline_source",
    "unsupported_child",
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <NoiseBoard>
        <simulation.pcbnoisesimulation
          duration="512ns"
          sampleInterval="20ps"
          baseline={
            invalid === "unknown_baseline_source"
              ? {
                  kind: "quiet_sources",
                  sourceNames: ["MISSING"],
                  voltage: "0V",
                }
              : undefined
          }
        >
          <simulation.pcbnoiseport
            name="a_tx"
            signal=".U1 > .A"
            reference=".U1 > .REF"
            referenceLayer="top"
          />
          {invalid === "duplicate_port" && (
            <simulation.pcbnoiseport
              name="a_tx"
              signal=".U2 > .A"
              reference=".U2 > .REF"
              referenceLayer="top"
            />
          )}
          <simulation.pcbnoiseexcitation
            port={invalid === "unknown_source_port" ? "MISSING" : "a_tx"}
            role="aggressor"
            sourceModel={{ kind: "thevenin", resistance: "50ohm" }}
            waveform={{ kind: "dc", voltage: "0V" }}
          />
          <simulation.pcbnoiseobservation
            name="voltage"
            port={invalid === "unknown_observation_port" ? "MISSING" : "a_tx"}
            quantity="voltage"
          />
          {invalid === "unsupported_child" && (
            <pcbnotetext text="Unsupported child" />
          )}
        </simulation.pcbnoisesimulation>
      </NoiseBoard>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      invalid === "unsupported_child"
        ? "can contain only noise"
        : "Invalid PCB noise configuration",
    )
    expect(circuit.db.simulation_pcb_noise_configuration.list()).toHaveLength(0)
  }
})
