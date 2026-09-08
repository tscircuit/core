import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB MCU differential pair exceeds its requested length skew", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="24mm" autorouter="auto-local">
      <net name="USB_DP" routingPhaseIndex={0} />
      <net name="USB_DM" routingPhaseIndex={0} />
      <net name="VBUS" routingPhaseIndex={1} />
      <net name="GND" routingPhaseIndex={1} />

      <chip
        name="U1"
        footprint="lqfp64"
        pcbX={0}
        pcbY={-4}
        pinLabels={{ pin44: "USB_DM", pin45: "USB_DP" }}
      />
      <resistor
        name="R1"
        resistance="22ohm"
        footprint="0603"
        pcbX={-1.5}
        pcbY={5.5}
        pcbRotation={90}
      />
      <resistor
        name="R2"
        resistance="22ohm"
        footprint="0603"
        pcbX={1.5}
        pcbY={5.5}
        pcbRotation={90}
      />
      <chip name="U2" footprint="soic8" pcbX={-10} pcbY={6} pcbRotation={90} />
      <chip
        name="J1"
        footprint={
          <footprint>
            <smtpad
              pcbX={-1.2}
              pcbY={0}
              width={0.6}
              height={1.8}
              shape="rect"
              portHints={["1"]}
            />
            <smtpad
              pcbX={-0.4}
              pcbY={0}
              width={0.6}
              height={1.8}
              shape="rect"
              portHints={["2"]}
            />
            <smtpad
              pcbX={0.4}
              pcbY={0}
              width={0.6}
              height={1.8}
              shape="rect"
              portHints={["3"]}
            />
            <smtpad
              pcbX={1.2}
              pcbY={0}
              width={0.6}
              height={1.8}
              shape="rect"
              portHints={["4"]}
            />
          </footprint>
        }
        pcbX={0}
        pcbY={9}
        pinLabels={{ pin1: "VBUS", pin2: "DM", pin3: "DP", pin4: "GND" }}
      />

      <trace from=".U1 > .USB_DP" to="net.USB_DP" />
      <trace from="net.USB_DP" to=".R1 > .pin1" />
      <trace from=".U1 > .USB_DM" to="net.USB_DM" />
      <trace from="net.USB_DM" to=".R2 > .pin1" />
      <trace from=".R1 > .pin2" to=".J1 > .DP" />
      <trace from=".R2 > .pin2" to=".J1 > .DM" />
      <trace from=".J1 > .VBUS" to=".U2 > .pin8" />
      <trace from=".J1 > .GND" to=".U2 > .pin4" />

      <differentialpair
        name="USB_FS"
        positiveConnection=".U1 > .USB_DP"
        negativeConnection=".U1 > .USB_DM"
        maxLengthSkew="0.5mm"
        pcbTraceGap="0.15mm"
      />
      <autoroutingphase phaseIndex={0} autorouter="auto-local" />
      <autoroutingphase phaseIndex={1} autorouter="auto-local" />

      <pcbnotetext
        text="USB MCU DIFFERENTIAL PAIR"
        pcbX={0}
        pcbY={-11}
        fontSize={0.7}
      />
      <pcbnotetext
        text="EXPECTED SKEW <= 0.5mm; ROUTED SKEW > 0.5mm"
        pcbX={0}
        pcbY={-10}
        fontSize={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const usbSourceNetIds = new Map(
    circuit.db.source_net
      .list()
      .filter((sourceNet) =>
        ["USB_DP", "USB_DM"].includes(sourceNet.name ?? ""),
      )
      .map((sourceNet) => [sourceNet.source_net_id, sourceNet.name]),
  )
  const usbRouteLengthsByNetName = new Map<string, number>()
  for (const pcbTrace of circuit.db.pcb_trace.list()) {
    if (!pcbTrace.source_trace_id) continue
    const sourceTrace = circuit.db.source_trace.get(pcbTrace.source_trace_id)
    const sourceNetId = sourceTrace?.connected_source_net_ids?.find((id) =>
      usbSourceNetIds.has(id),
    )
    if (!sourceNetId) continue
    const sourceNetName = usbSourceNetIds.get(sourceNetId)
    if (!sourceNetName) continue

    const wirePoints = pcbTrace.route.filter(
      (routePoint) => routePoint.route_type === "wire",
    )
    let routeLength = 0
    for (let pointIndex = 1; pointIndex < wirePoints.length; pointIndex++) {
      const previousPoint = wirePoints[pointIndex - 1]!
      const routePoint = wirePoints[pointIndex]!
      routeLength += Math.hypot(
        routePoint.x - previousPoint.x,
        routePoint.y - previousPoint.y,
      )
    }
    usbRouteLengthsByNetName.set(sourceNetName, routeLength)
  }

  const usbDpLength = usbRouteLengthsByNetName.get("USB_DP")
  const usbDmLength = usbRouteLengthsByNetName.get("USB_DM")
  expect(usbDpLength).toBeDefined()
  expect(usbDmLength).toBeDefined()
  expect(Math.abs(usbDpLength! - usbDmLength!)).toBeGreaterThan(0.5)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 30_000)
