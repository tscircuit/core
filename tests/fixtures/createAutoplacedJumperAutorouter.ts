import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "./createBasicAutorouter"

export const createAutoplacedJumperOutput = (y: number) => ({
  jumper_footprint: "0603",
  center: { x: 0, y },
  orientation: "vertical",
  width: 2.8,
  height: 0.8,
  pads: [
    {
      center: { x: -1, y },
      width: 0.7,
      height: 0.7,
      layer: "top",
    },
    {
      center: { x: 1, y },
      width: 0.7,
      height: 0.7,
      layer: "top",
    },
  ],
})

export const createAutoplacedJumperTraceOutput = ({
  connectionName,
  start,
  end,
  jumperY,
}: {
  connectionName: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  jumperY: number
}): SimplifiedPcbTrace => ({
  type: "pcb_trace",
  pcb_trace_id: "autoplaced_jumper_trace",
  connection_name: connectionName,
  route: [
    {
      route_type: "wire",
      x: start.x,
      y: start.y,
      width: 0.15,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -1,
      y: jumperY,
      width: 0.15,
      layer: "top",
    },
    {
      route_type: "jumper",
      start: { x: -1, y: jumperY },
      end: { x: 1, y: jumperY },
      footprint: "0603",
      layer: "top",
    },
    {
      route_type: "wire",
      x: 1,
      y: jumperY,
      width: 0.15,
      layer: "top",
    },
    {
      route_type: "wire",
      x: end.x,
      y: end.y,
      width: 0.15,
      layer: "top",
    },
  ],
})

export const createAutoplacedJumperAutorouter =
  (jumperY: number, options: { omitPcbTraceId?: boolean } = {}) =>
  async (simpleRouteJson: SimpleRouteJson) => {
    const autorouter = await createBasicAutorouter(async (autorouterInput) => {
      const connection = autorouterInput.connections[0]!
      const [start, end] = connection.pointsToConnect
      const trace = createAutoplacedJumperTraceOutput({
        connectionName: connection.name,
        start: start!,
        end: end!,
        jumperY,
      })
      if (options.omitPcbTraceId) {
        const { pcb_trace_id: _pcbTraceId, ...traceWithoutPcbTraceId } = trace
        return [traceWithoutPcbTraceId as SimplifiedPcbTrace]
      }
      return [trace]
    })(simpleRouteJson)

    return Object.assign(autorouter, {
      solver: {
        getOutputJumpers: () => [createAutoplacedJumperOutput(jumperY)],
      },
    })
  }
