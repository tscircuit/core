import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"

/**
 * Exact signal extract from the 4-Motor USB-C motherboard, 2026-11-06.
 * Original staged-ground/candidate.json: staged_170 on source_net_57 (M1_IMON).
 * SHA256: 71b1c299508a4f029eded88057bbc3c99e6ceb1fb58486a2cfca2916666a0c25.
 *
 * Route points use the original board-world frame: mm, +X right, +Y up,
 * +Z above, right-handed. No translation, rotation, or rerouting is applied.
 * It runs from R116.pin1 on bottom to U103.pin9 (ILM) on top.
 * U103: TPS259470LRPWR / JLCPCB C3662793; R116: 0603WAF1001T5E / C21190.
 * Footprints below retain all imported pads and courtyards in footprint-local
 * mm (+X right, +Y up, +Z above). Core mirrors R116 onto the bottom layer.
 * Decorative supplier paths/text and CAD are omitted, as in the board adapter.
 * Other nets/components are omitted; this is not the complete motherboard.
 */
export const m1ImonRouterRoute = [
  {
    route_type: "wire",
    x: -62.246636,
    y: -35,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -63.10000000000001,
    y: -35.7,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -65.5,
    y: -36.6,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -65.60000000000001,
    y: -36.7,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -68.7,
    y: -37.300000000000004,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -69.10000000000001,
    y: -37.7,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -70.00000000000001,
    y: -37.900000000000006,
    layer: "bottom" as const,
    width: 0.2,
  },
  {
    route_type: "via",
    x: -70.00000000000001,
    y: -37.900000000000006,
    from_layer: "bottom" as const,
    to_layer: "top" as const,
    via_diameter: 0.6,
    via_hole_diameter: 0.3,
  },
  {
    route_type: "wire",
    x: -70.00000000000001,
    y: -37.900000000000006,
    layer: "top" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -70.50000000000001,
    y: -38.2,
    layer: "top" as const,
    width: 0.2,
  },
  {
    route_type: "wire",
    x: -71.0949853,
    y: -38.274956,
    layer: "top" as const,
    width: 0.2,
  },
] satisfies SimplifiedPcbTrace["route"]

export function M1ImonComponents() {
  return (
    <>
      <chip
        name="U103"
        pcbX={-72}
        pcbY={-38.5}
        manufacturerPartNumber="TPS259470LRPWR"
        supplierPartNumbers={{ jlcpcb: ["C3662793"] }}
        pinLabels={{
          pin1: ["EN", "UVLO"],
          pin2: ["OVLO", "OVCSEL"],
          pin3: ["PG", "AUXOFF"],
          pin4: ["N_FLT", "PGTH"],
          pin5: ["IN"],
          pin6: ["OUT"],
          pin7: ["DVDT"],
          pin8: ["GND"],
          pin9: ["ILM"],
          pin10: ["ITIMER"],
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              points={[
                { x: "-0.8650351mm", y: "1.1999976mm" },
                { x: "-0.8650351mm", y: "0.8999982mm" },
                { x: "-0.8650351mm", y: "0.8999982mm" },
                { x: "-1.2149963mm", y: "0.8999982mm" },
                { x: "-1.2149963mm", y: "0.8999982mm" },
                { x: "-1.2149963mm", y: "0.5999988mm" },
                { x: "-1.2149963mm", y: "0.5999988mm" },
                { x: "-0.8650351mm", y: "0.5999988mm" },
                { x: "-0.8650351mm", y: "0.5999988mm" },
                { x: "-0.6150483mm", y: "0.5999988mm" },
                { x: "-0.6150483mm", y: "0.5999988mm" },
                { x: "-0.6149975mm", y: "0.5999988mm" },
                { x: "-0.6149975mm", y: "0.5999988mm" },
                { x: "-0.6149975mm", y: "0.8999982mm" },
                { x: "-0.6149975mm", y: "0.8999982mm" },
                { x: "-0.6150483mm", y: "0.8999982mm" },
                { x: "-0.6150483mm", y: "0.8999982mm" },
                { x: "-0.6150483mm", y: "1.1999976mm" },
                { x: "-0.6150483mm", y: "1.1999976mm" },
                { x: "-0.8650351mm", y: "1.1999976mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin4"]}
              points={[
                { x: "-0.8553577mm", y: "-1.1999976mm" },
                { x: "-0.8553577mm", y: "-0.8999728mm" },
                { x: "-0.8553577mm", y: "-0.8999728mm" },
                { x: "-1.2053189mm", y: "-0.8999728mm" },
                { x: "-1.2053189mm", y: "-0.8999728mm" },
                { x: "-1.2053189mm", y: "-0.5999988mm" },
                { x: "-1.2053189mm", y: "-0.5999988mm" },
                { x: "-0.8553577mm", y: "-0.5999988mm" },
                { x: "-0.8553577mm", y: "-0.5999988mm" },
                { x: "-0.6053709mm", y: "-0.5999988mm" },
                { x: "-0.6053709mm", y: "-0.5999988mm" },
                { x: "-0.6053201mm", y: "-0.5999988mm" },
                { x: "-0.6053201mm", y: "-0.5999988mm" },
                { x: "-0.6053201mm", y: "-0.8999728mm" },
                { x: "-0.6053201mm", y: "-0.8999728mm" },
                { x: "-0.6053709mm", y: "-0.8999728mm" },
                { x: "-0.6053709mm", y: "-0.8999728mm" },
                { x: "-0.6053709mm", y: "-1.1999976mm" },
                { x: "-0.6053709mm", y: "-1.1999976mm" },
                { x: "-0.8553577mm", y: "-1.1999976mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin7"]}
              points={[
                { x: "0.8650351mm", y: "-1.1999722mm" },
                { x: "0.8650351mm", y: "-0.8999728mm" },
                { x: "0.8650351mm", y: "-0.8999728mm" },
                { x: "1.2149963mm", y: "-0.8999728mm" },
                { x: "1.2149963mm", y: "-0.8999728mm" },
                { x: "1.2149963mm", y: "-0.5999734mm" },
                { x: "1.2149963mm", y: "-0.5999734mm" },
                { x: "0.8650351mm", y: "-0.5999734mm" },
                { x: "0.8650351mm", y: "-0.5999734mm" },
                { x: "0.6150483mm", y: "-0.5999734mm" },
                { x: "0.6150483mm", y: "-0.5999734mm" },
                { x: "0.6149975mm", y: "-0.5999734mm" },
                { x: "0.6149975mm", y: "-0.5999734mm" },
                { x: "0.6149975mm", y: "-0.8999728mm" },
                { x: "0.6149975mm", y: "-0.8999728mm" },
                { x: "0.6150483mm", y: "-0.8999728mm" },
                { x: "0.6150483mm", y: "-0.8999728mm" },
                { x: "0.6150483mm", y: "-1.1999722mm" },
                { x: "0.6150483mm", y: "-1.1999722mm" },
                { x: "0.8650351mm", y: "-1.1999722mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin10"]}
              points={[
                { x: "0.8650351mm", y: "1.1999976mm" },
                { x: "0.8650351mm", y: "0.8999982mm" },
                { x: "0.8650351mm", y: "0.8999982mm" },
                { x: "1.2149963mm", y: "0.8999982mm" },
                { x: "1.2149963mm", y: "0.8999982mm" },
                { x: "1.2149963mm", y: "0.5999988mm" },
                { x: "1.2149963mm", y: "0.5999988mm" },
                { x: "0.8650351mm", y: "0.5999988mm" },
                { x: "0.8650351mm", y: "0.5999988mm" },
                { x: "0.6150483mm", y: "0.5999988mm" },
                { x: "0.6150483mm", y: "0.5999988mm" },
                { x: "0.6149975mm", y: "0.5999988mm" },
                { x: "0.6149975mm", y: "0.5999988mm" },
                { x: "0.6149975mm", y: "0.8999982mm" },
                { x: "0.6149975mm", y: "0.8999982mm" },
                { x: "0.6150483mm", y: "0.8999982mm" },
                { x: "0.6150483mm", y: "0.8999982mm" },
                { x: "0.6150483mm", y: "1.1999976mm" },
                { x: "0.6150483mm", y: "1.1999976mm" },
                { x: "0.8650351mm", y: "1.1999976mm" },
              ]}
              shape="polygon"
            />
            <smtpad
              portHints={["pin5"]}
              pcbX="-0.2349373mm"
              pcbY="0mm"
              width="0.2999994mm"
              height="2.3999952mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin6"]}
              pcbX="0.2649347mm"
              pcbY="0mm"
              width="0.2999994mm"
              height="2.3999952mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="-0.9049893mm"
              pcbY="0.225044mm"
              width="0.5999988mm"
              height="0.2500122mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="-0.9052433mm"
              pcbY="-0.225044mm"
              width="0.5999988mm"
              height="0.2500122mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin9"]}
              pcbX="0.9050147mm"
              pcbY="0.225044mm"
              width="0.5999988mm"
              height="0.2500122mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin8"]}
              pcbX="0.9050147mm"
              pcbY="-0.225044mm"
              width="0.5999988mm"
              height="0.2500122mm"
              shape="rect"
            />

            <silkscreencircle
              pcbX="-1.7149953mm"
              pcbY="1.229868mm"
              radius="0.13462mm"
            />

            <courtyardoutline
              outline={[
                { x: -1.4649963000000525, y: 1.4499976000000743 },
                { x: 1.4649963000000525, y: 1.4499976000000743 },
                { x: 1.4649963000000525, y: -1.4499975999999606 },
                { x: -1.4649963000000525, y: -1.4499975999999606 },
                { x: -1.4649963000000525, y: 1.4499976000000743 },
              ]}
            />
          </footprint>
        }
      />
      <resistor
        name="R116"
        resistance="1k"
        pcbX={-63}
        pcbY={-35}
        layer="bottom"
        manufacturerPartNumber="0603WAF1001T5E"
        supplierPartNumbers={{ jlcpcb: ["C21190"] }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin2"]}
              pcbX="0.753364mm"
              pcbY="0mm"
              width="0.8064754mm"
              height="0.8640064mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin1"]}
              pcbX="-0.753364mm"
              pcbY="0mm"
              width="0.8064754mm"
              height="0.8640064mm"
              shape="rect"
            />

            <courtyardoutline
              outline={[
                { x: -1.4066016999998965, y: 0.6820032000000538 },
                { x: 1.4066016999997828, y: 0.6820032000000538 },
                { x: 1.4066016999997828, y: -0.6820032000000538 },
                { x: -1.4066016999998965, y: -0.6820032000000538 },
                { x: -1.4066016999998965, y: 0.6820032000000538 },
              ]}
            />
          </footprint>
        }
      />
      <net name="M1_IMON" />
      <trace from="U103.pin9" to="net.M1_IMON" thickness={0.2} />
      <trace from="R116.pin1" to="net.M1_IMON" thickness={0.2} />
      <pcbnotetext
        text="U103.9 / ILM (TOP)"
        pcbX={-72}
        pcbY={-40.7}
        fontSize={0.5}
      />
      <pcbnotetext
        text="R116.1 (BOTTOM)"
        pcbX={-63}
        pcbY={-33.5}
        fontSize={0.5}
      />
      <pcbnotetext text="VIA" pcbX={-69.8} pcbY={-39.2} fontSize={0.45} />
    </>
  )
}
