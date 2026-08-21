import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1", "VTREF"],
  pin2: ["pin2", "GND"],
  pin3: ["pin3", "SWDIO"],
  pin4: ["pin4", "SWDCLK"],
  pin5: ["pin5", "nRESET"],
  pin6: ["pin6", "MP1"],
  pin7: ["pin7", "MP2"],
} as const

export const BM05B_SRSS_TB_LF__SN_ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C160391"],
      }}
      manufacturerPartNumber="BM05B_SRSS_TB_LF__SN_"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin7"]}
            pcbX="-3.299968mm"
            pcbY="-1.1998833mm"
            width="1.1999976mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="3.299968mm"
            pcbY="-1.1998833mm"
            width="1.1999976mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-1.999996mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-0.999998mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0.999998mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="1.999996mm"
            pcbY="1.3248767mm"
            width="0.5999988mm"
            height="1.5500096mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.468829199999959, y: -1.8425033000000894 },
              { x: 2.4688800000001265, y: -1.8425033000000894 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.5311607999999524, y: 1.0784966999999597 },
              { x: 3.556025400000067, y: 1.0784966999999597 },
              { x: 3.556025400000067, y: -0.0688466999999946 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.555974600000013, y: -0.0688466999999946 },
              { x: -3.555974600000013, y: 1.0784966999999597 },
              { x: -2.5311099999998987, y: 1.0784966999999597 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 3.1005780000000414, y: 1.7134967000000643 },
              { x: 3.094459028033498, y: 1.6670184935186398 },
              { x: 3.0765191099608273, y: 1.6237076999998408 },
              { x: 3.0479808215519597, y: 1.5865158784481537 },
              { x: 3.010789000000159, y: 1.557977590039286 },
              { x: 2.9674782064814735, y: 1.5400376719666156 },
              { x: 2.921000000000163, y: 1.5339186999999583 },
              { x: 2.8745217935187384, y: 1.5400376719666156 },
              { x: 2.8312109999999393, y: 1.557977590039286 },
              { x: 2.794019178448252, y: 1.5865158784481537 },
              { x: 2.7654808900393846, y: 1.6237076999998408 },
              { x: 2.747540971966714, y: 1.6670184935186398 },
              { x: 2.741422000000057, y: 1.7134967000000643 },
              { x: 2.747540971966714, y: 1.759974906481375 },
              { x: 2.7654808900393846, y: 1.8032857000000604 },
              { x: 2.794019178448252, y: 1.8404775215518612 },
              { x: 2.8312109999999393, y: 1.8690158099607288 },
              { x: 2.8745217935187384, y: 1.8869557280333993 },
              { x: 2.921000000000163, y: 1.8930746999999428 },
              { x: 2.9674782064814735, y: 1.8869557280333993 },
              { x: 3.010789000000159, y: 1.8690158099607288 },
              { x: 3.0479808215519597, y: 1.8404775215518612 },
              { x: 3.0765191099608273, y: 1.8032857000000604 },
              { x: 3.094459028033498, y: 1.759974906481375 },
              { x: 3.1005780000000414, y: 1.7134967000000643 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.010668mm"
            pcbY="3.1044027mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -4.159568000000036, y: 2.354402700000037 },
              { x: 4.138232000000016, y: 2.354402700000037 },
              { x: 4.138232000000016, y: -2.336597299999994 },
              { x: -4.159568000000036, y: -2.336597299999994 },
              { x: -4.159568000000036, y: 2.354402700000037 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C160391.obj?uuid=eaf9e23008df4ce1b5a7b451075b7284",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C160391.step?uuid=eaf9e23008df4ce1b5a7b451075b7284",
        pcbRotationOffset: 180,
        modelOriginPosition: {
          x: 2.000025400000027,
          y: -0.43250299999996966,
          z: -0.01,
        },
      }}
      {...props}
    />
  )
}
