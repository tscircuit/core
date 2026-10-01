import { expect, spyOn, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import jstFootprint from "tests/fixtures/assets/external-jst-ph-b2b-footprint.json"
import usbFootprint from "tests/fixtures/assets/external-usb3-a-footprint.json"
import "./helpers"

test("public JST and USB footprint fixtures preserve complete rendered output", async () => {
  for (const fixture of [jstFootprint, usbFootprint]) {
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
      Object.assign(async () => Response.json(fixture), {
        preconnect: globalThis.fetch.preconnect,
      }),
    )
    try {
      const circuits = [
        new RootCircuit({ platform: { routingDisabled: true } }),
        new RootCircuit({
          platform: { routingDisabled: true },
          experimentalFootprintLoading: {},
        }),
      ]
      for (const circuit of circuits) {
        circuit.add(
          <board width="30mm" height="30mm">
            <chip name="J1" footprint="https://footprint.test/connector.json" />
          </board>,
        )
        await circuit.renderUntilSettled()
      }
      expect(circuits[1].getCircuitJson()).toEqual(circuits[0].getCircuitJson())
      expect(
        circuits[1].db.pcb_smtpad.list().length +
          circuits[1].db.pcb_plated_hole.list().length,
      ).toBeGreaterThan(0)
      expect(circuits[1].db.external_footprint_load_error.list()).toHaveLength(
        0,
      )
    } finally {
      fetchSpy.mockRestore()
    }
  }
})
