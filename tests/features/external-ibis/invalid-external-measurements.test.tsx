import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("external measurements reject native experiments, duplicate traffic, and invalid eye gates", async () => {
  const native = getTestFixture().circuit
  native.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <analog.transientsimulation name="run" />
      <analog.digitalstimulus
        name="data"
        simulationRef=".run"
        sourcePinRef=".U1 > .pin1"
        bitDuration="2ns"
        startTime="0ns"
        initialState={0}
        transmittedData={{ transmissionType: "bits", bits: "01", repeat: true }}
      />
    </board>,
  )
  await expect(native.renderUntilSettled()).rejects.toThrow(
    'spiceEngine="pcb_spice"',
  )
  const duplicate = getTestFixture().circuit
  duplicate.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <analog.transientsimulation
        spiceEngine="pcb_spice"
        name="run"
        duration="20ns"
        ibisPinStates={{
          ".U1 > .pin1": { isOutput: true, isOutputEnabled: true },
        }}
      />
      {["one", "two"].map((name) => (
        <analog.digitalstimulus
          key={name}
          name={name}
          simulationRef=".run"
          sourcePinRef=".U1 > .pin1"
          bitDuration="2ns"
          startTime="0ns"
          initialState={0}
          transmittedData={{
            transmissionType: "bits",
            bits: "01",
            repeat: true,
          }}
        />
      ))}
    </board>,
  )
  await expect(duplicate.renderUntilSettled()).rejects.toThrow(
    "duplicates a driven pin",
  )
  const eye = getTestFixture().circuit
  eye.add(
    <board routingDisabled>
      <chip name="U1" footprint="soic4" />
      <analog.transientsimulation
        spiceEngine="pcb_spice"
        name="run"
        duration="20ns"
      />
      <voltageprobe name="probe" connectsTo=".U1 > .pin1" />
      <analog.eyediagram
        name="eye"
        simulationRef=".run"
        probeRef=".probe"
        unitInterval="2ns"
        timeOrigin="0ns"
        startTime="19ns"
        endTime="20ns"
      />
    </board>,
  )
  await expect(eye.renderUntilSettled()).rejects.toThrow(
    "at least two bit intervals",
  )
})
