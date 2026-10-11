import { expect, test } from "bun:test"
import type { AutorouterDefinition } from "@tscircuit/props"
import type { PcbTrace } from "circuit-json"
import type { FanoutTracePath } from "lib/index"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

type SourceOwnedSimplifiedPcbTrace = SimplifiedPcbTrace &
  Pick<PcbTrace, "source_trace_id">

test("dogbone preserves earlier custom copper without duplicating saved copper", async () => {
  for (const previousCopperKind of ["custom", "saved"] as const) {
    // Board-world points in mm: +X right, +Y up.
    const earlierRoute = [
      { route_type: "wire", x: -6, y: 3, layer: "top", width: 0.102 },
      { route_type: "wire", x: -4, y: 3, layer: "top", width: 0.102 },
    ] satisfies FanoutTracePath["route"]
    const createEarlierCopper = createBasicAutorouter(async (input) => {
      const connection = input.connections[0]!
      return [
        {
          type: "pcb_trace",
          pcb_trace_id: "earlier_phase_copper",
          connection_name: connection.name,
          source_trace_id: connection.source_trace_id,
          route: earlierRoute,
        } satisfies SourceOwnedSimplifiedPcbTrace,
      ]
    })
    // Use the real dogbone solver, then inspect its handoff without depending on
    // a second solver's ability to finish the unrelated BGA-to-testpoint route.
    const createFollowUpRouter = createBasicAutorouter(async () => [])
    const { circuit } = getTestFixture({
      platform: {
        autorouterMap: {
          default: {
            // Platform presets use the event-based local autorouter contract;
            // props declares the separate async run/output contract.
            createAutorouter:
              createFollowUpRouter as unknown as AutorouterDefinition["createAutorouter"],
          },
        },
      },
    })
    circuit.schematicDisabled = true
    const phaseIo = createAutoroutingPhaseIoStack(circuit)
    circuit.add(
      <board
        width={20}
        height={16}
        layers={4}
        routeRemaining={false}
        minTraceWidth={0.102}
        defaultTraceWidth={0.102}
        minTraceToPadEdgeClearance={0.1}
        minViaEdgeToPadEdgeClearance={0.1}
        minViaPadDiameter={0.3}
        minViaHoleDiameter={0.15}
      >
        <autoroutingphase
          name="EARLIER_COPPER"
          phaseIndex={0}
          algorithmFn={
            previousCopperKind === "custom" ? createEarlierCopper : undefined
          }
          pcbTracePaths={
            previousCopperKind === "saved"
              ? [{ connection: "M1.pin1", route: earlierRoute }]
              : undefined
          }
        />
        <testpoint name="M1" pcbX={-6} pcbY={3} padDiameter={0.4} />
        <testpoint name="M2" pcbX={-4} pcbY={3} padDiameter={0.4} />
        <trace
          name="EARLIER"
          from="M1.pin1"
          to="M2.pin1"
          routingPhaseIndex={0}
        />
        <autoroutingphase
          name="SIGNAL_DOGBONE"
          phaseIndex={1}
          autorouter="dogbone"
          fanoutRoutingLayers={["inner2"]}
        />
        <chip
          name="U1"
          footprint={
            <footprint>
              {Array.from({ length: 16 }, (_, padIndex) => (
                <Fragment key={padIndex}>
                  <smtpad
                    portHints={[`pin${padIndex + 1}`]}
                    pcbX={(padIndex % 4) * 0.8 - 1.2}
                    pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
                    shape="circle"
                    radius={0.2}
                  />
                </Fragment>
              ))}
            </footprint>
          }
        />
        <testpoint name="DEST" pcbX={6} pcbY={0} padDiameter={0.4} />
        <trace
          name="SIGNAL"
          from="U1.pin6"
          to="DEST.pin1"
          routingPhaseIndex={1}
        />
        <pcbnotetext
          pcbY={6.5}
          fontSize={0.4}
          text="M1-M2 copper must survive a native dogbone phase"
        />
        <pcbnotetext
          pcbY={5.5}
          fontSize={0.35}
          text="Follow-up observes handoff; U1-DEST intentionally unfinished"
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    expect(phaseIo).toHaveLength(3)
    const earlierTrace = phaseIo[0]!.endSimpleRouteJson!.traces![0]!
    const dogboneInput = phaseIo[1]!.startSimpleRouteJson!
    const dogboneOutput = phaseIo[1]!.endSimpleRouteJson!
    const followUpInput = phaseIo[2]!.startSimpleRouteJson!
    expect(
      dogboneOutput.traces?.some((trace) =>
        trace.route.some((point) => point.route_type === "via"),
      ),
    ).toBe(true)
    if (previousCopperKind === "custom") {
      expect(dogboneInput.traces).toEqual([earlierTrace])
      expect(circuit).toMatchPcbSnapshot(import.meta.path)
      // Preserve the exact preceding copper, including its ID, route,
      // connection name, and source ownership, in both phase handoffs.
      expect(
        dogboneOutput.traces?.filter(
          (trace) => trace.pcb_trace_id === earlierTrace.pcb_trace_id,
        ),
      ).toEqual([earlierTrace])
      expect(
        followUpInput.traces?.filter(
          (trace) => trace.pcb_trace_id === earlierTrace.pcb_trace_id,
        ),
      ).toEqual([earlierTrace])
    } else {
      // Saved copper already becomes fixed obstacles before dogbone routing.
      // The handoff must keep those obstacles without introducing trace copies.
      expect(dogboneInput.traces).toEqual([])
      expect(followUpInput.traces).toEqual([])
      expect(
        followUpInput.obstacles.some(
          (obstacle) =>
            Math.abs(obstacle.center.x + 5) < 1e-6 &&
            Math.abs(obstacle.center.y - 3) < 1e-6,
        ),
      ).toBe(true)
    }
    const sourceTraceId =
      phaseIo[0]!.startSimpleRouteJson!.connections[0]!.source_trace_id
    const physicalEarlierTraces = circuit.db.pcb_trace
      .list()
      .filter((trace) => trace.source_trace_id === sourceTraceId)
    expect(physicalEarlierTraces).toHaveLength(1)
    expect(
      physicalEarlierTraces[0]!.route.map((point) => {
        if (point.route_type !== "wire")
          throw new Error("Earlier wire gained a via")
        return {
          route_type: point.route_type,
          x: point.x,
          y: point.y,
          layer: point.layer,
          width: point.width,
        }
      }),
    ).toEqual(earlierRoute)
  }
})
