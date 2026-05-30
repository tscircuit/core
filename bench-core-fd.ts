/**
 * End-to-end core demo for tscircuit#3208: render N resistors and time the
 * schematic layout with the default greedy packer vs the new force-directed
 * packer, selected via the board prop schLayout.packPlacementStrategy.
 *
 *   bun bench-core-fd.ts
 */
import "lib/register-catalogue"
import { Circuit, createElement } from "./index"

function run(n: number, strategy?: "force_directed") {
  const circuit = new Circuit()
  const children = Array.from({ length: n }, (_, i) =>
    createElement("resistor", { name: `R${i}`, resistance: "1k" }),
  )
  const boardProps: any = { width: "100mm", height: "100mm" }
  if (strategy) boardProps.schLayout = { packPlacementStrategy: strategy }
  circuit.add(createElement("board", boardProps, ...children))
  const t0 = performance.now()
  circuit.render()
  const ms = performance.now() - t0
  const sch = circuit.db.schematic_component.list().length
  return { ms, sch }
}

console.log("n   greedy(ms)   FD(ms)   speedup   greedy_sch/FD_sch")
console.log("-".repeat(56))
for (const n of [10, 30, 50]) {
  const g = run(n)
  const f = run(n, "force_directed")
  console.log(
    `${String(n).padStart(3)}  ${g.ms.toFixed(0).padStart(9)}  ${f.ms.toFixed(0).padStart(7)}  ${(g.ms / f.ms).toFixed(1).padStart(6)}x   ${g.sch}/${f.sch}`,
  )
}
