import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reproduces routing failures for a differential pair with four pads per net", async () => {
  const cases = [
    {
      autorouter: "auto",
      useNamedNets: true,
      error:
        'Could not find an SRJ connection for trace name or port selector "USB_DP"',
    },
    {
      autorouter: "auto",
      useNamedNets: false,
      error: "must resolve to exactly one final point-pair connection, got 3",
    },
    {
      autorouter: "bus_lanes",
      useNamedNets: false,
      error: "Multi-terminal differential pairs are not supported",
    },
  ] as const

  for (const { autorouter, useNamedNets, error } of cases) {
    const { circuit } = getTestFixture()
    const routingErrors: string[] = []
    circuit.on("asyncEffect:end", (event) => {
      if (event.effectName === "autorouting" && event.error) {
        routingErrors.push(event.error)
      }
    })
    circuit.add(
      <board width={24} height={12} schematicDisabled autorouter={autorouter}>
        <pinheader name="J1" pinCount={2} pcbX={-8} pcbRotation={90} />
        <chip name="D1" footprint="sot23" pcbX={-4} />
        <testpoint name="TP1" footprintVariant="pad" pcbX={1} pcbY={1.5} />
        <testpoint name="TP2" footprintVariant="pad" pcbX={1} pcbY={-1.5} />
        <chip name="U1" footprint="soic8" pcbX={7} />
        {useNamedNets ? (
          <>
            <trace name="USB_DP" from="J1.pin1" to="net.USB_DP" />
            <trace from="D1.pin1" to="net.USB_DP" />
            <trace from="TP1.pin1" to="net.USB_DP" />
            <trace from="U1.pin1" to="net.USB_DP" />
            <trace name="USB_DM" from="J1.pin2" to="net.USB_DM" />
            <trace from="D1.pin2" to="net.USB_DM" />
            <trace from="TP2.pin1" to="net.USB_DM" />
            <trace from="U1.pin2" to="net.USB_DM" />
          </>
        ) : (
          <>
            <trace
              name="USB_DP"
              path={["J1.pin1", "D1.pin1", "TP1.pin1", "U1.pin1"]}
            />
            <trace
              name="USB_DM"
              path={["J1.pin2", "D1.pin2", "TP2.pin1", "U1.pin2"]}
            />
          </>
        )}
        <differentialpair
          name="USB"
          positiveConnection="USB_DP"
          negativeConnection="USB_DM"
          pcbTraceGap={0.2}
        />
        <pcbnotetext
          pcbX={0}
          pcbY={-4.5}
          fontSize={0.45}
          text="USB D+ and D- each connect J1, ESD D1, a test point, and U1."
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(
      routingErrors,
      `${autorouter}, useNamedNets=${useNamedNets}`,
    ).toEqual([expect.stringContaining(error)])
    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    if (autorouter === "auto" && !useNamedNets) {
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
