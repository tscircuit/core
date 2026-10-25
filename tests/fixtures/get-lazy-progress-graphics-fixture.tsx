import type { GraphicsObject } from "graphics-debug"
import { RootCircuit } from "lib/RootCircuit"
import type { AutoroutingProgressEvent } from "lib/events"
import "lib/register-catalogue"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

/** Generated native PCB in world mm (+X right, +Y up), without saved copper. */
export async function getLazyProgressGraphicsFixture(consumeGraphics = false) {
  const circuit = new RootCircuit()
  const previews = { count: 0 }
  const progress: AutoroutingProgressEvent[] = []
  const graphicReads: { sameObject: boolean }[] = []
  const algorithmFn = async (input: SimpleRouteJson) => {
    const router = new TscircuitAutorouter(input)
    const owner = router as unknown as {
      solver: { preview(): GraphicsObject | null | undefined }
    }
    const preview = owner.solver.preview.bind(owner.solver)
    owner.solver.preview = () => {
      previews.count += 1
      return preview()
    }
    return router
  }
  circuit.on("autorouting:progress", (event) => {
    progress.push(event)
    if (consumeGraphics) {
      const first = event.debugGraphics
      graphicReads.push({ sameObject: first === event.debugGraphics })
    }
  })
  circuit.add(
    <board
      width={12}
      height={8}
      schAutoLayoutEnabled={false}
      autorouter={{ algorithmFn }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        text={consumeGraphics ? "Graphics requested" : "Metrics only"}
        pcbY={-2.8}
        pcbX={0}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const rows = circuit.getCircuitJson()
  const traces = rows.filter((row) => row.type === "pcb_trace")
  const errors = rows.filter((row) => row.type.endsWith("_error"))
  return { circuit, traces, errors, previews, progress, graphicReads }
}
