import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test('cadModel="footprinter_string" requires a Footprinter footprint string', () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" cadModel="footprinter_string">
        <footprint>
          <smtpad
            portHints={["1"]}
            pcbX={0}
            pcbY={0}
            width="1mm"
            height="1mm"
            shape="rect"
          />
        </footprint>
      </chip>
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    'cannot use cadModel="footprinter_string" because its footprint does not resolve to a Footprinter string',
  )
})
