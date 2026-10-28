import { expect, test } from "bun:test"
import { Circuit, assembly } from "lib"

test("TSX stage target membership rejects cycles before export", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="D">
      <assembly.explosion.stage name="one">
        <assembly.explosion.move targetRef="two" offX={1} />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="two">
        <assembly.explosion.move targetRef="one" offY={1} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(() => circuit.getCircuitJson()).toThrow(
    'Explosion stage membership cycle at "D.one"',
  )
})
