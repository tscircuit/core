import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
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
} as const

const pinAttributes = {
  pin8: { requiresGround: true },
} as const

export const TPS259470LRPWR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C3662793"],
      }}
      manufacturerPartNumber="TPS259470LRPWR"
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
          <silkscreenpath
            route={[
              { x: -1.265008899999998, y: 1.1256010000000742 },
              { x: -1.265008899999998, y: 1.329994799999895 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0517250999999987, y: -1.2800075999999763 },
              { x: -1.265008899999998, y: -1.2800075999999763 },
              { x: -1.265008899999998, y: -1.116660199999842 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3449934999999869, y: -1.09054900000001 },
              { x: 1.3449934999999869, y: -1.2800075999999763 },
              { x: 1.0816971000000422, y: -1.2800075999999763 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.0621644999999944, y: 1.3199872000001278 },
              { x: 1.3449934999999869, y: 1.3199872000001278 },
              { x: 1.3449934999999869, y: 1.0905743999999231 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.2250038999998196, y: 1.3199872000001278 },
              { x: -1.0621644999998807, y: 1.3199872000001278 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.7149953mm"
            pcbY="1.229868mm"
            radius="0.13462mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.2390013mm"
            pcbY="2.3716mm"
            anchorAlignment="center"
            fontSize="1mm"
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
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C3662793.obj?uuid=262834a5342148ebb2da8f3848ec58ce",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C3662793.step?uuid=262834a5342148ebb2da8f3848ec58ce",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.004987299999929751, y: 0, z: -0.05 },
      }}
      {...props}
    />
  )
}
