import { expect, test } from "bun:test"
import { FourAxisMotorCarrier } from "tests/fixtures/four-axis-motor-carrier"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via directions on the routed four-axis motor carrier", async () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true, useCloudAutorouter: false },
  })
  circuit.add(<FourAxisMotorCarrier />)
  await circuit.renderUntilSettled()

  let routedVias = 0
  let backwardVias = 0
  for (const { route } of circuit.db.pcb_trace.list()) {
    for (const [viaIndex, via] of route.entries()) {
      if (via.route_type !== "via") continue
      const incomingWire = route[viaIndex - 1]
      const outgoingWire = route[viaIndex + 1]
      if (
        incomingWire?.route_type !== "wire" ||
        outgoingWire?.route_type !== "wire"
      ) {
        continue
      }

      routedVias++
      if (
        incomingWire.layer !== via.from_layer ||
        outgoingWire.layer !== via.to_layer
      ) {
        backwardVias++
      }
    }
  }

  circuit.db.pcb_note_text.insert({
    text: `${backwardVias} of ${routedVias} routed vias have backward directions`,
    anchor_position: { x: 0, y: -27 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 1.4,
    layer: "top",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 650,
    shouldDrawErrors: false,
  })
  expect(routedVias).toBe(37)
  expect(backwardVias).toBe(14)
}, 120_000)
