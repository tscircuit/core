import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("multiple boards cannot ambiguously determine one motor placement", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.motor name="MOTOR" standard="nema17" />
      <board
        name="B1"
        width={42}
        height={42}
        mountedTo="MOTOR.backface"
        routingDisabled
      />
      <board
        name="B2"
        width={42}
        height={42}
        pcbX={100}
        mountedTo="MOTOR.backface"
        routingDisabled
      />
    </assembly.device>,
  )
  expect(() => circuit.render()).toThrow(/multiple mounted boards/)
})
