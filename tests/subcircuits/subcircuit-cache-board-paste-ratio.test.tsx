import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sharing a footprint cache across boards keeps each board's stencil size", async () => {
  const cache = new Map<string, AnyCircuitElement[]>()
  for (const [ratio, expected] of [
    [undefined, 0.7],
    [0, 1],
    [-0.1, 0.8],
    [0, 1],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.cachedSubcircuits = cache
    circuit.add(
      <board
        width={6}
        height={6}
        defaultSolderPasteMarginRatio={ratio}
        routingDisabled
        schematicDisabled
      >
        <subcircuit name="Cached" _subcircuitCachingEnabled>
          <chip
            name="J1"
            footprint={
              <footprint>
                <smtpad shape="circle" radius={1} portHints={["1"]} />
              </footprint>
            }
          />
        </subcircuit>
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_solder_paste.list()).toMatchObject([
      { shape: "circle", radius: expected },
    ])
  }
  expect(cache.size).toBe(3)
})
