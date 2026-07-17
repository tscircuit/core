import { expect, test } from "bun:test"
import type { LayerRef } from "circuit-json"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const COPPER_LAYERS: LayerRef[] = [
  "top",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "inner7",
  "inner8",
  "bottom",
]

const GATE_Y_POSITIONS = COPPER_LAYERS.map((_, index) => 9 - index * 2)

test(
  "pipeline 7 routes a TSX layer maze that requires exactly ten layers",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board
        width="8mm"
        height="24mm"
        layers={10}
        autorouter={{ local: true, groupMode: "subcircuit" }}
        autorouterVersion="v6"
      >
        <testpoint
          name="START"
          footprintVariant="pad"
          padShape="rect"
          width="1mm"
          height="1mm"
          layer="top"
          pcbX={0}
          pcbY={11}
        />
        {GATE_Y_POSITIONS.map((pcbY, passableLayerIndex) => (
          <Fragment key={COPPER_LAYERS[passableLayerIndex]}>
            <keepout
              shape="rect"
              width="8mm"
              height="0.8mm"
              pcbX={0}
              pcbY={pcbY}
              layers={COPPER_LAYERS.filter(
                (_, layerIndex) => layerIndex !== passableLayerIndex,
              )}
            />
          </Fragment>
        ))}
        <testpoint
          name="END"
          footprintVariant="pad"
          padShape="rect"
          width="1mm"
          height="1mm"
          layer="bottom"
          pcbX={0}
          pcbY={-11}
        />
        <trace from=".START > .pin1" to=".END > .pin1" />
        <pcbnotetext
          text="10-layer forced route: top to bottom"
          fontSize="0.25mm"
          pcbX={0}
          pcbY={11.8}
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_board.list()[0]?.num_layers).toBe(10)
    expect(circuit.db.pcb_keepout.list()).toHaveLength(10)
    expect(
      circuit.db.pcb_keepout
        .list()
        .every((keepout) => keepout.layers.length === 9),
    ).toBe(true)

    const routedLayers = new Set(
      circuit.db.pcb_trace
        .list()
        .flatMap((trace) => trace.route)
        .filter((routePoint) => routePoint.route_type === "wire")
        .map((routePoint) => routePoint.layer),
    )
    expect(routedLayers).toEqual(new Set(COPPER_LAYERS))

    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  },
  { timeout: 120_000 },
)
