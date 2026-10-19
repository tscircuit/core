import { beforeAll, expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const phaseIo = createAutoroutingPhaseIoStack(circuit)

beforeAll(async () => {
  circuit.add(
    <board width={20} height={20} layers={4} autorouterVersion="beta_pipeline9">
      <autoroutingphase
        phaseIndex={0}
        connection="U1.SIG"
        autorouter="auto_local"
      />
      <keepout shape="rect" width={2} height={20} layers={["top"]} />
      <chip
        name="U1"
        pcbX={-5}
        pinLabels={{ pin1: "SIG" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={0.8}
              height={0.8}
            />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={5}
        pinLabels={{ pin1: "SIG" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={0.8}
              height={0.8}
            />
          </footprint>
        }
      />
      <trace name="signal" from=".U1 > .SIG" to=".U2 > .SIG" />
      <bus
        name="OuterOnly"
        connections={["signal"]}
        pcbAllowedLayers={["top", "bottom"]}
      />
      <pcbnotetext pcbY={7} fontSize={0.6} text="Allowed: top, bottom" />
      <pcbnotetext
        pcbY={5.5}
        fontSize={0.6}
        text="Inner layers reserved for planes"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(phaseIo).toHaveLength(1)
  expect(phaseIo[0]!.startSimpleRouteJson!.buses).toEqual([
    {
      busId: "OuterOnly",
      name: "OuterOnly",
      connectionNames: [circuit.db.source_trace.list()[0]!.source_trace_id],
      allowedLayers: ["top", "bottom"],
    },
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])

  // The reserved inner layer must contain no signal wire.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "inner1",
    showDebugObjects: false,
    showSolderMask: false,
    hiddenLayerOpacity: 0.2,
  })
  await expect(
    convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
      layer: "bottom",
      showDebugObjects: false,
      showSolderMask: false,
      hiddenLayerOpacity: 0.2,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "repro-bus-allowed-layers-bottom")
})

test("bus pcbAllowedLayers keeps signal wires off inner layers", () => {
  const wireLayers = new Set(
    circuit.db.pcb_trace
      .list()
      .flatMap((trace) =>
        trace.route
          .filter((point) => point.route_type === "wire")
          .map((point) => point.layer),
      ),
  )
  // The top-only keepout forces a layer change; bottom is available.
  expect([...wireLayers].sort()).toEqual(["bottom", "top"])
})
