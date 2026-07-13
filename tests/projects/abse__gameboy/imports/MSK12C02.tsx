import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin4_alt1"],
  pin6: ["pin4_alt1"],
  pin7: ["pin4_alt1"],
} as const

export const MSK12C02 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C431540"],
      }}
      manufacturerPartNumber="MSK12C02"
      footprint={
        <footprint>
          <hole pcbX="-1.49987mm" pcbY="-0.75616435mm" diameter="0.9000236mm" />
          <hole pcbX="1.500124mm" pcbY="-0.75616435mm" diameter="0.9000236mm" />
          <smtpad
            portHints={["pin4"]}
            pcbX="3.599942mm"
            pcbY="0.39394765mm"
            width="1.1999976mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="3.599942mm"
            pcbY="-1.90602235mm"
            width="1.1999976mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-3.599942mm"
            pcbY="-1.90602235mm"
            width="1.1999976mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.599942mm"
            pcbY="0.39394765mm"
            width="1.1999976mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="2.249932mm"
            pcbY="1.49402165mm"
            width="0.5999988mm"
            height="1.524mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.750062mm"
            pcbY="1.49402165mm"
            width="0.5999988mm"
            height="1.524mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.249932mm"
            pcbY="1.49402165mm"
            width="0.5999988mm"
            height="1.524mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.1500124000000369, y: -3.736016149999841 },
              { x: 1.4254734000001008, y: -3.736016149999841 },
              { x: 1.4254734000001008, y: -2.1359939499999427 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.1500124000000369, y: -2.1359939499999427 },
              { x: 0.1500124000000369, y: -3.736016149999841 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.399993199999926, y: -0.1500695499998983 },
              { x: 3.399993199999926, y: -1.3500671499998589 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.399993199999926, y: -0.1500695499998983 },
              { x: -3.399993199999926, y: -1.3500671499998589 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.749981799999887, y: -2.1560345499999585 },
              { x: 2.7500325999999404, y: -2.1560345499999585 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.768879399999946, y: 0.7439342500000521 },
              { x: 2.7588971999999785, y: 0.7439342500000521 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4999970000001213, y: 0.7439342500000521 },
              { x: 0, y: 0.7439342500000521 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.005842mm"
            pcbY="3.25017965mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.459541999999942, y: 2.5001796500000637 },
              { x: 4.4478579999999965, y: 2.5001796500000637 },
              { x: 4.4478579999999965, y: -3.9942203499999778 },
              { x: -4.459541999999942, y: -3.9942203499999778 },
              { x: -4.459541999999942, y: 2.5001796500000637 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C431540.obj?uuid=fc12522ae2f04394b021187ce17b23bb",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C431540.step?uuid=fc12522ae2f04394b021187ce17b23bb",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 0.000025400000026820635,
          y: -0.7060877499999378,
          z: -0.0000010000000000287557,
        },
      }}
      {...props}
    />
  )
}
