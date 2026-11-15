import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { Circuit, Board, Resistor } from "@tscircuit/core"

assert.ok(
  fileURLToPath(import.meta.resolve("@tscircuit/core")).startsWith(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "node_modules",
      "@tscircuit",
      "core",
    ) + "/",
  ),
  "Core must resolve from the temporary consumer, not the checkout",
)

// Use the documented non-React API, without a JSX loader or checkout helpers.
// No traces or remote parts: this tests local rendering, not network autorouting.
const circuit = new Circuit()
const board = new Board({ width: "20mm", height: "20mm" })
circuit.add(board)
board.add(new Resistor({ name: "R1", resistance: "10k", footprint: "0603" }))
await circuit.renderUntilSettled()
const records = circuit.getCircuitJson()
assert.ok(records.some((record) => record.type === "pcb_board"))
assert.ok(
  records.some(
    (record) => record.type === "source_component" && record.name === "R1",
  ),
)
assert.ok(records.some((record) => record.type === "pcb_component"))
assert.ok(records.some((record) => record.type === "schematic_component"))
console.log("Packed Core imports and renders in a clean npm consumer")
