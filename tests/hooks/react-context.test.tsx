import { expect, test } from "bun:test"
import { createContext, useContext } from "react"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

const ValueContext = createContext("default")

const ContextualBoard = () => {
  const resistorName = useContext(ValueContext)
  return (
    <board width="10mm" height="10mm">
      <resistor name={resistorName} resistance="10k" footprint="0402" />
    </board>
  )
}

test("components can consume values from React context", async () => {
  const circuit = new RootCircuit()

  circuit.add(
    <ValueContext.Provider value="R_CTX">
      <ContextualBoard />
    </ValueContext.Provider>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_component.select(".R_CTX")?.name).toBe("R_CTX")
})
