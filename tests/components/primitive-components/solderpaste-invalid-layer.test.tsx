import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("paste rejects inner layers even inside flipped footprints", () => {
  for (const layer of ["top", "bottom"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={10}
        height={10}
        layers={4}
        routingDisabled
        schematicDisabled
      >
        <chip
          name="U1"
          layer={layer}
          footprint={
            <footprint>
              <solderpaste shape="rect" width={2} height={1} layer="inner1" />
            </footprint>
          }
        />
      </board>,
    )
    expect(() => circuit.render()).toThrow(
      'Invalid layer "inner1" for SolderPaste. Must be "top" or "bottom".',
    )
    expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)
  }
})
