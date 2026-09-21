import { createBasicAutorouter } from "./createBasicAutorouter"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

// Deterministic board-world routes in mm, +X right and +Y up. Separate
// wire/via/wire records model through barrels used by inner-layer fanout.
export function ThroughViaInnerLayerBoard({
  omitLeftVia = false,
}: { omitLeftVia?: boolean }) {
  const wire = (x: number, layer = "top") => ({
    route_type: "wire" as const,
    x,
    y: 0,
    width: 0.2,
    layer,
  })
  return (
    <board
      width={18}
      height={10}
      layers={4}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (input) => {
          const routes: SimplifiedPcbTrace["route"][] = [
            [wire(-5), wire(-2)],
            [wire(-2, "inner2"), wire(2, "inner2")],
            [wire(2), wire(5)],
            ...(omitLeftVia ? [2] : [-2, 2]).map((x) => [
              wire(x),
              {
                route_type: "via" as const,
                x,
                y: 0,
                from_layer: "top",
                to_layer: "bottom",
                via_diameter: 0.6,
                via_hole_diameter: 0.3,
              },
              wire(x, "bottom"),
            ]),
          ]
          return routes.map((route, i) => ({
            type: "pcb_trace",
            pcb_trace_id: `route_${i}`,
            connection_name: input.connections[0]!.name,
            source_trace_id: input.connections[0]!.source_trace_id,
            route,
          }))
        }),
      }}
    >
      {([-5, 5] as const).map((x, i) => (
        <chip
          key={x}
          name={`J${i + 1}`}
          pcbX={x}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["1"]}
                shape="circle"
                radius={0.5}
                pcbX={0}
                pcbY={0}
              />
            </footprint>
          }
        />
      ))}
      <trace from="J1.pin1" to="J2.pin1" />
      <pcbnotetext text={"<board layers={4} />"} pcbY={4} fontSize={0.5} />
      <pcbnotetext
        text={
          omitLeftVia
            ? "Left via missing: top cannot reach inner2"
            : "Top pads -> through vias -> inner2 bridge"
        }
        pcbY={3}
        fontSize={0.45}
      />
      <pcbnotetext text="top escape" pcbX={-4} pcbY={1} fontSize={0.4} />
      <pcbnotetext text="inner2" pcbY={1} fontSize={0.4} />
      <pcbnotetext text="top escape" pcbX={4} pcbY={1} fontSize={0.4} />
      <pcbnotetext
        text="Barrels span top / inner1 / inner2 / bottom"
        pcbY={-2}
        fontSize={0.4}
      />
      <pcbnotetext
        text={
          omitLeftVia
            ? "Expected DRC: missing connection to J2.SIGNAL"
            : "Expected: connected, no missing-connection DRC"
        }
        pcbY={-3.2}
        fontSize={0.4}
      />
    </board>
  )
}
