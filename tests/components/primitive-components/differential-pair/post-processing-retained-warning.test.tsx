import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test(
  "retains original pair geometry and emits stable warnings on failure",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="20mm" height="10mm" autorouter={{ traceClearance: 0.5 }}>
        <differentialpair
          name="USB_UNSATISFIABLE"
          positiveConnection="USB_P"
          negativeConnection="USB_N"
          maxLengthSkew={0.05}
        />
        <chip
          name="IN"
          pcbX={-6}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={-0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
            </footprint>
          }
        />
        <chip
          name="OUT"
          pcbX={6}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbY={-0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbY={0.15}
                width={0.1}
                height={0.1}
                shape="rect"
              />
            </footprint>
          }
        />
        <trace name="USB_P" from=".IN > .pin1" to=".OUT > .pin1" />
        <trace name="USB_N" from=".IN > .pin2" to=".OUT > .pin2" />
        <pcbnotetext
          pcbX={0}
          pcbY={3.5}
          fontSize={0.65}
          text="Unsatisfiable 0.5mm clearance: originals retained with warnings"
        />
      </board>,
    )

    await circuit.renderUntilSettled()
    const firstWarningIds = circuit.db.pcb_trace_warning
      .list()
      .filter((warning) => warning.message.includes("USB_UNSATISFIABLE"))
      .map((warning) => warning.pcb_trace_warning_id)
      .sort()

    circuit.render()
    const secondWarningIds = circuit.db.pcb_trace_warning
      .list()
      .filter((warning) => warning.message.includes("USB_UNSATISFIABLE"))
      .map((warning) => warning.pcb_trace_warning_id)
      .sort()

    expect(firstWarningIds).toHaveLength(2)
    expect(secondWarningIds).toEqual(firstWarningIds)
    expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 15_000 },
)
