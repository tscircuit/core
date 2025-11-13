import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Regression test ensuring smtpads render even when no port hints are provided.
 */
test("smtpad within footprint renders without port hints", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        layer="top"
        footprint={
          <footprint>
            <smtpad shape="rect" width="1mm" height="1mm" pcbX={-1} pcbY={0} />
            <smtpad shape="rect" width="1mm" height="1mm" pcbX={1} pcbY={0} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list()

  expect(smtpads.length).toBe(2)
  for (const smtpad of smtpads) {
    expect(smtpad.port_hints).toEqual([])
  }
})
