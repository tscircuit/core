import { expect, test } from "bun:test"
import { simulation } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { NoiseBoard, noisePrbs } from "tests/fixtures/pcb-noise-board"

test("noise channels reject duplicate, unresolved, DC eye, nested and unsupported declarations", async () => {
  for (const invalid of [
    "duplicate_channel",
    "unknown_eye_channel",
    "unknown_timing_channel",
    "unknown_baseline_channel",
    "victim_baseline_channel",
    "dc_data_channel",
    "dc_timing_channel",
    "invalid_offset",
    "duplicate_eye",
    "unsupported_child",
    "nested_simulation",
    "channel_children",
    "no_channels",
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <NoiseBoard>
        <simulation.pcbnoisesimulation
          duration="512ns"
          sampleInterval="20ps"
          baseline={
            invalid === "unknown_baseline_channel"
              ? { quietChannels: ["MISSING"], voltage: "0V" }
              : invalid === "victim_baseline_channel"
                ? { quietChannels: ["v"], voltage: "0V" }
                : undefined
          }
        >
          {invalid !== "no_channels" &&
            ["a", "v"].map((name) => (
              <simulation.pcbnoisechannel
                key={name}
                name={invalid === "duplicate_channel" ? "a" : name}
                role={name === "a" ? "aggressor" : "victim"}
                source={`.U1 > .${name.toUpperCase()}`}
                sourceReference=".U1 > .REF"
                sourceReferenceLayer="top"
                load={`.U2 > .${name.toUpperCase()}`}
                loadReference=".U2 > .REF"
                loadReferenceLayer="top"
                sourceImpedance="50ohm"
                loadImpedance="50ohm"
                loadBiasVoltage="0V"
                waveform={
                  (invalid === "dc_data_channel" && name === "v") ||
                  (invalid === "dc_timing_channel" && name === "a")
                    ? { kind: "dc", voltage: "0V" }
                    : noisePrbs
                }
                {...(invalid === "channel_children"
                  ? {
                      children: <pcbnotetext text="Unsupported nested child" />,
                    }
                  : {})}
              />
            ))}
          {invalid !== "no_channels" && (
            <simulation.pcbnoiseeye
              channel={
                invalid === "unknown_eye_channel"
                  ? "MISSING"
                  : invalid === "duplicate_channel"
                    ? "a"
                    : "v"
              }
              timing={{
                kind: "source",
                channel: invalid === "unknown_timing_channel" ? "MISSING" : "a",
                sampleOffset: invalid === "invalid_offset" ? "2ns" : "1ns",
              }}
            />
          )}
          {invalid === "duplicate_eye" && (
            <simulation.pcbnoiseeye
              channel="v"
              timing={{ kind: "source", channel: "v", sampleOffset: "1ns" }}
            />
          )}
          {invalid === "unsupported_child" && (
            <pcbnotetext text="Unsupported child" />
          )}
          {invalid === "nested_simulation" && (
            <simulation.pcbnoisesimulation
              duration="512ns"
              sampleInterval="20ps"
            />
          )}
        </simulation.pcbnoisesimulation>
      </NoiseBoard>,
    )
    const message = {
      duplicate_channel: "Names must be unique",
      unknown_eye_channel: "Unknown eye channel",
      unknown_timing_channel: "Unknown timing channel",
      unknown_baseline_channel: "Unknown baseline channel",
      victim_baseline_channel: "must be an aggressor",
      dc_data_channel: "must have an active PRBS waveform",
      dc_timing_channel: "must have a PRBS waveform",
      invalid_offset: "sampleOffset must be less than the unit interval",
      duplicate_eye: "Only one eye per observation",
      unsupported_child: "can contain only noise channels and eyes",
      nested_simulation: "cannot contain another simulation",
      channel_children: "can contain only noise channels and eyes",
      no_channels: "Invalid PCB noise configuration",
    }[invalid]
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
    expect(circuit.db.simulation_pcb_noise_configuration.list()).toHaveLength(0)
  }
})
