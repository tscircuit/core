import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("no false-positive source_pin_missing_trace_warning when ports are connected on async footprint component", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: [
            {
              type: "pcb_smtpad",
              pcb_smtpad_id: "pad1",
              shape: "rect",
              x: -1,
              y: 0,
              width: 0.5,
              height: 0.5,
              layer: "top",
              port_hints: ["1", "pin1"],
            },
            {
              type: "pcb_smtpad",
              pcb_smtpad_id: "pad2",
              shape: "rect",
              x: 0,
              y: 0,
              width: 0.5,
              height: 0.5,
              layer: "top",
              port_hints: ["2", "pin2"],
            },
            {
              type: "pcb_smtpad",
              pcb_smtpad_id: "pad3",
              shape: "rect",
              x: 1,
              y: 0,
              width: 0.5,
              height: 0.5,
              layer: "top",
              port_hints: ["3", "pin3"],
            },
          ],
        }),
      },
    },
  })

  circuit.add(
    <board width="30mm" height="20mm">
      <switch
        name="SW1"
        type="spdt"
        footprint="kicad:Button_Switch_SMD/SW_SPDT_PCM12"
      />
      <trace from=".SW1 > .pin1" to=".SW1 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warnings = circuit
    .getCircuitJson()
    .filter((e) => e.type === "source_pin_missing_trace_warning")

  // pin1 and pin2 are connected via the trace; only unconnected pin3 should emit warning
  const warnedMessages = warnings.map((w: any) => w.message)
  expect(warnedMessages).not.toContain("Port pin1 on SW1 is missing a trace")
  expect(warnedMessages).not.toContain("Port pin2 on SW1 is missing a trace")
  expect(warnedMessages).toContain("Port pin3 on SW1 is missing a trace")
  expect(warnings).toHaveLength(1)
})
