import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "parent route should not cross a preserved child-subcircuit trace",
  async () => {
    const { circuit: flatCircuit } = getTestFixture()
    flatCircuit.add(
      <board
        width="20mm"
        height="16mm"
        layers={1}
        minTraceWidth="0.15mm"
        defaultTraceWidth="0.15mm"
        minTraceToPadEdgeClearance="0.15mm"
      >
        <chip
          name="U_BARRIER"
          pcbX={3}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1", "TOP"]}
                pcbY={5.35}
                shape="rect"
                width="1.2mm"
                height="1.2mm"
              />
              <smtpad
                portHints={["pin2", "BOTTOM"]}
                pcbY={-5.35}
                shape="rect"
                width="1.2mm"
                height="1.2mm"
              />
            </footprint>
          }
        />
        <chip
          name="U_TARGET"
          pcbX={0}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="rect"
                width="1.2mm"
                height="1.2mm"
              />
            </footprint>
          }
        />
        <trace
          name="CHILD_INTERNAL"
          from=".U_BARRIER > .TOP"
          to=".U_BARRIER > .BOTTOM"
        />
        <chip
          name="U_OUTSIDE"
          pcbX={8}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="rect"
                width="1.2mm"
                height="1.2mm"
              />
            </footprint>
          }
        />
        <trace
          name="PARENT_EXTERNAL"
          from=".U_OUTSIDE > .pin1"
          to=".U_TARGET > .pin1"
        />
      </board>,
    )
    await flatCircuit.renderUntilSettled()

    // The geometry is routable when both connections are owned by the board:
    // the autorouter sees both at once and routes the horizontal connection
    // around one endpoint of the vertical connection.
    expect(flatCircuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(flatCircuit.db.pcb_trace_error.list()).toEqual([])

    const { circuit: nestedCircuit } = getTestFixture()
    const nestedAutoroutingPhaseIoStack =
      createAutoroutingPhaseIoStack(nestedCircuit)
    nestedCircuit.add(
      <board
        width="20mm"
        height="16mm"
        layers={1}
        minTraceWidth="0.15mm"
        defaultTraceWidth="0.15mm"
        minTraceToPadEdgeClearance="0.15mm"
      >
        <subcircuit name="INNER">
          <chip
            name="U_BARRIER"
            pcbX={3}
            pcbY={0}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1", "TOP"]}
                  pcbY={5.35}
                  shape="rect"
                  width="1.2mm"
                  height="1.2mm"
                />
                <smtpad
                  portHints={["pin2", "BOTTOM"]}
                  pcbY={-5.35}
                  shape="rect"
                  width="1.2mm"
                  height="1.2mm"
                />
              </footprint>
            }
          />
          <chip
            name="U_TARGET"
            pcbX={0}
            pcbY={0}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  shape="rect"
                  width="1.2mm"
                  height="1.2mm"
                />
              </footprint>
            }
          />
          <trace
            name="CHILD_INTERNAL"
            from=".U_BARRIER > .TOP"
            to=".U_BARRIER > .BOTTOM"
          />
        </subcircuit>
        <chip
          name="U_OUTSIDE"
          pcbX={8}
          pcbY={0}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                shape="rect"
                width="1.2mm"
                height="1.2mm"
              />
            </footprint>
          }
        />
        <trace
          name="PARENT_EXTERNAL"
          from=".U_OUTSIDE > .pin1"
          to=".INNER .U_TARGET > .pin1"
        />
        <pcbnotetext
          pcbX={-4}
          pcbY={7.4}
          fontSize={0.42}
          text="BUG: parent crosses child copper"
        />
      </board>,
    )
    await nestedCircuit.renderUntilSettled()

    const parentPhase = nestedAutoroutingPhaseIoStack.at(-1)
    expect(parentPhase?.startSimpleRouteJson?.connections).toHaveLength(1)
    expect(parentPhase?.startSimpleRouteJson?.traces).toHaveLength(1)
    expect(nestedCircuit).toMatchPcbSnapshot(import.meta.path)

    // This is the desired behavior. It currently fails because the parent
    // route crosses the already-routed, different-net child trace.
    expect(nestedCircuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(nestedCircuit.db.pcb_trace_error.list()).toEqual([])
  },
)
