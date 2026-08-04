import { expect, test } from "bun:test"
import { Led } from "lib/components/normal-components/Led"
import { RootCircuit } from "lib/RootCircuit"

test("led accepts legacy numeric pinLabels keys", () => {
  const circuit = new RootCircuit()

  circuit.add(
    <led
      name="LED1"
      pinLabels={{
        "1": "pos",
        "2": "neg",
      }}
    />,
  )

  circuit.render()

  expect(circuit.db.source_failed_to_create_component_error.list()).toEqual([])

  const led = circuit.selectOne("led") as Led
  expect(led._parsedProps.pinLabels).toEqual({ pin1: "pos", pin2: "neg" })
  expect(led.pos).toBeDefined()
  expect(led.pos._parsedProps.pinNumber).toBe(1)
  expect(led.neg).toBeDefined()
  expect(led.neg._parsedProps.pinNumber).toBe(2)
})
