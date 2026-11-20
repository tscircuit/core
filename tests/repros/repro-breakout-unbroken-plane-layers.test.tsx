import { expect, test } from "bun:test"
import { checkViasInPads } from "@tscircuit/checks"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("automatic BGA exits avoid unbroken power planes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={18}
      height={20}
      layers={4}
      minTraceWidth={0.15}
      minTraceToPadEdgeClearance={0.1}
      minTraceToHoleEdgeClearance={0.1}
      minViaPadDiameter={0.3}
    >
      <copperpour layer="inner1" connectsTo="net.GND" unbroken />
      <copperpour layer="inner2" connectsTo="net.VCC" unbroken />
      <breakout
        name="CONTROLLER"
        pcbY={4}
        padding="0.3mm"
        fanoutRoutingLayers={["top", "inner1", "inner2", "bottom"]}
      >
        <chip name="U1" footprint="bga16_grid4x4_p0.8mm" />
      </breakout>
      <chip name="U2" footprint="bga16_grid4x4_p0.8mm" pcbY={-5} />
      {Array.from({ length: 16 }, (_, pinIndex) => (
        <trace
          key={`signal_${pinIndex}`}
          name={`SIGNAL_${pinIndex + 1}`}
          from={`U1.pin${pinIndex + 1}`}
          to={`U2.pin${pinIndex + 1}`}
        />
      ))}
      {Array.from({ length: 4 }, (_, busIndex) => (
        <Fragment key={`bus_${busIndex}`}>
          <bus
            name={`BUS_${busIndex}`}
            connections={Array.from(
              { length: 4 },
              (_, pinIndex) => `SIGNAL_${busIndex * 4 + pinIndex + 1}`,
            )}
            preferredLayers={["top", "inner1", "inner2", "bottom"]}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text="BGA controller link | Inner layers reserved for GND and VCC"
        pcbY={9}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const exits = circuit.db.pcb_breakout_point.list()
  const planeExits = exits.filter((exit) =>
    ["inner1", "inner2"].includes(exit.layer ?? "top"),
  )
  const routingErrors = circuit.db.pcb_autorouting_error.list()
  circuit.db.pcb_note_text.insert({
    text: `Signal exits in power planes: ${planeExits.length}/${exits.length} | Routing errors: ${routingErrors.length}`,
    anchor_position: { x: 0, y: 8 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.3,
    layer: "top",
  })
  expect(exits).toHaveLength(16)
  expect(checkViasInPads(circuit.getCircuitJson())).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    backgroundColor: "white",
    width: 1000,
    height: 1100,
    showPcbGroups: false,
    showDebugObjects: false,
    shouldDrawRatsNest: false,
  })
}, 60_000)
