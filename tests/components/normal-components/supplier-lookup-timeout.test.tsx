import { expect, mock, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render settles with a local footprint when the supplier lookup never responds", async () => {
  const fetchPartCircuitJson = mock(() => new Promise<never>(() => {}))
  const { circuit } = getTestFixture({
    platform: { partsEngine: { findPart: () => ({}), fetchPartCircuitJson } },
  })

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="EXAMPLE"
        supplierPartNumbers={{ jlcpcb: ["C1234"] }}
        footprint="soic8"
      />
    </board>,
  )

  const originalSetTimeout = globalThis.setTimeout
  globalThis.setTimeout = new Proxy(originalSetTimeout, {
    apply: (setTimeout, receiver, [callback, delay, ...args]) => {
      if (delay === 10_000) delay = 0
      return Reflect.apply(setTimeout, receiver, [callback, delay, ...args])
    },
  })
  try {
    await circuit.renderUntilSettled()
    expect(fetchPartCircuitJson).toHaveBeenCalledWith(
      expect.objectContaining({ includeDatasheetInformation: true }),
    )
    expect(fetchPartCircuitJson).toHaveBeenCalledWith(
      expect.objectContaining({ includeDatasheetInformation: false }),
    )
    expect(circuit.getRunningAsyncEffects()).toEqual([])
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(8)
  } finally {
    globalThis.setTimeout = originalSetTimeout
  }
}, 1_000)
