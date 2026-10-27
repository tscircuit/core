import { expect, test } from "bun:test"
import { analog } from "lib/namespaced-elements/analog"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("eye gates contain a complete origin-aligned two-UI window after recording starts", async () => {
  const cases = [
    { startTime: "40ns", endTime: "45ns", valid: false },
    { startTime: "40ns", endTime: "46ns", valid: false },
    { startTime: "40ns", endTime: "47.5ns", valid: true },
    { startTime: "41.25ns", endTime: "46.25ns", valid: true },
    { startTime: "40ns", endTime: "45ns", timeOrigin: "1.25ns", valid: true },
    { startTime: "40ns", endTime: "45ns", timeOrigin: "-1.25ns", valid: true },
    { recordingStart: "40ns", duration: "45ns", valid: false },
    { recordingStart: "40ns", duration: "47.5ns", valid: true },
    { recordingStart: "41.25ns", duration: "46.25ns", valid: true },
  ]
  for (const {
    recordingStart,
    duration,
    timeOrigin,
    startTime,
    endTime,
    valid,
  } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board routingDisabled>
        <chip name="U1" footprint="soic4" />
        <analog.transientsimulation
          spiceEngine="pcb_spice"
          name="run"
          startTime={recordingStart ?? "0ns"}
          duration={duration ?? "50ns"}
        />
        <voltageprobe name="probe" connectsTo=".U1 > .pin1" />
        <analog.eyediagram
          name="data-eye"
          simulationRef=".run"
          probeRef=".probe"
          unitInterval="2.5ns"
          timeOrigin={timeOrigin ?? "0ns"}
          startTime={startTime}
          endTime={endTime}
        />
      </board>,
    )
    if (valid) {
      await circuit.renderUntilSettled()
      expect(circuit.db.simulation_eye_diagram.list()).toHaveLength(1)
    } else {
      await expect(circuit.renderUntilSettled()).rejects.toThrow(
        'Eye "data-eye" needs a gate within its simulation containing at least two bit intervals forming a complete two-UI eye window aligned to timeOrigin after recording starts.',
      )
    }
  }
})
