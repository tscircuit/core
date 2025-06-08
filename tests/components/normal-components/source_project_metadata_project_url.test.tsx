import { test, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { su } from "@tscircuit/circuit-json-util"
import "lib/register-catalogue"

const createBoard = () => (
  <board width="10mm" height="10mm">
    <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
  </board>
)

test("projectUrl populates source_project_metadata.project_url", async () => {
  const circuit = new RootCircuit({ projectUrl: "https://example.com" })
  circuit.add(createBoard())
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const meta = su(circuitJson).source_project_metadata.list()[0]
  expect(meta.project_url).toBe("https://example.com")
})
