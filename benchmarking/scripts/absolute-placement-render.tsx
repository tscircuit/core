/** Reproduce imported-board render costs without external assets or autorouting.
 * Run: bun benchmarking/scripts/absolute-placement-render.tsx [component-count]
 * Coordinates are board-world millimeters: +X right, +Y up, +Z out of the board (right-handed); positions, not directions.
 */
import { createHash } from "node:crypto"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

const componentCount = Number(process.argv[2] ?? 1500)
const circuit = new RootCircuit({
  platform: {
    drcChecksDisabled: true,
    partsEngineDisabled: true,
    schematicDisabled: true,
  },
})
circuit.add(
  <board width={200} height={200} routingDisabled schematicDisabled>
    {Array.from({ length: componentCount }, (_, i) => {
      const x = (i % 40) * 4 - 80,
        y = Math.floor(i / 40) * 4 - 80
      return (
        <capacitor
          key={i}
          name={`C${i + 1}`}
          capacitance="100nF"
          pcbX={x}
          pcbY={y}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={-0.5}
                pcbY={0}
                shape="rect"
                width={0.5}
                height={0.6}
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={0.5}
                pcbY={0}
                shape="rect"
                width={0.5}
                height={0.6}
              />
            </footprint>
          }
        />
      )
    })}
  </board>,
)
const started = performance.now()
await circuit.renderUntilSettled()
const renderMs = performance.now() - started
const circuitJson = JSON.parse(JSON.stringify(circuit.getCircuitJson()))
console.log(
  JSON.stringify(
    {
      componentCount,
      renderMs,
      records: circuitJson.length,
      sha256: createHash("sha256")
        .update(JSON.stringify(circuitJson))
        .digest("hex"),
    },
    null,
    2,
  ),
)
