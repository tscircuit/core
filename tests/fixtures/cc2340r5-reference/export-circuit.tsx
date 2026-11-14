import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"
import Cc2340Reference from "./index"

// bun tests/fixtures/cc2340r5-reference/export-circuit.tsx /path/to/output.json
const outputPath = process.argv[2]
if (!outputPath) throw new Error("Provide an output JSON path")
const circuit = new RootCircuit({ platform: { pcbDisabled: true } })
circuit.add(<Cc2340Reference />)
await circuit.renderUntilSettled()
const circuitJson = circuit
  .getCircuitJson()
  .filter(
    (element) =>
      element.type.startsWith("source_") ||
      element.type.startsWith("schematic_"),
  )
await Bun.write(outputPath, `${JSON.stringify(circuitJson, null, 2)}\n`)
