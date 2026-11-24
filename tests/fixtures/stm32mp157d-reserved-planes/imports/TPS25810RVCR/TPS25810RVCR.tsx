import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["N_FAULT"],
  pin2: ["IN12"],
  pin3: ["IN11"],
  pin4: ["IN2"],
  pin5: ["AUX"],
  pin6: ["EN"],
  pin7: ["CHG"],
  pin8: ["CHG_HI"],
  pin9: ["REF_RTN"],
  pin10: ["REF"],
  pin11: ["CC1"],
  pin12: ["GND"],
  pin13: ["CC2"],
  pin14: ["OUT2"],
  pin15: ["OUT1"],
  pin16: ["N_DEBUG"],
  pin17: ["N_AUDIO"],
  pin18: ["N_POL"],
  pin19: ["N_UFP"],
  pin20: ["N_LD_DET"],
  pin21: ["EP"],
} as const

const pinAttributes = {
  pin12: { requiresGround: true },
} as const

export const TPS25810RVCR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C473913"],
      }}
      manufacturerPartNumber="TPS25810RVCR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin21"]}
            pcbX="0mm"
            pcbY="-0.000127mm"
            width="2.5999948mm"
            height="1.5999968mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-1.249934mm"
            pcbY="1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="-0.750062mm"
            pcbY="1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="-0.249936mm"
            pcbY="1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="0.249936mm"
            pcbY="1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="0.750062mm"
            pcbY="1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.249934mm"
            pcbY="1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.249934mm"
            pcbY="-1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.750062mm"
            pcbY="-1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.249936mm"
            pcbY="-1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.249936mm"
            pcbY="-1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.750062mm"
            pcbY="-1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.249934mm"
            pcbY="-1.499997mm"
            width="0.2999994mm"
            height="0.8999982mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-1.999996mm"
            pcbY="-0.749935mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-1.999996mm"
            pcbY="-0.250063mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-1.999996mm"
            pcbY="0.250063mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-1.999996mm"
            pcbY="0.749935mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.999996mm"
            pcbY="0.749935mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.999996mm"
            pcbY="0.250063mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.999996mm"
            pcbY="-0.250063mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.999996mm"
            pcbY="-0.749935mm"
            width="0.8999982mm"
            height="0.2999994mm"
            radius="0.1499997mm"
            shape="pill"
          />
          <silkscreenpath
            route={[
              { x: 1.6509745999999268, y: -1.7779745999999932 },
              { x: 2.2859745999999177, y: -1.7779745999999932 },
              { x: 2.2859745999999177, y: -1.1429746000000023 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.6509745999999268, y: 1.7780253999999331 },
              { x: 2.2859745999999177, y: 1.7780253999999331 },
              { x: 2.2859745999999177, y: 1.143025400000056 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.2860253999999713, y: 1.143025400000056 },
              { x: -2.2860253999999713, y: 1.7780253999999331 },
              { x: -1.6510254000000941, y: 1.7780253999999331 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.6510254000000941, y: -1.7779745999999932 },
              { x: -1.9050253999999995, y: -1.7779745999999932 },
              { x: -2.2860253999999713, y: -1.3969746000000214 },
              { x: -2.2860253999999713, y: -1.1429746000000023 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.800098mm"
            pcbY="-2.200021mm"
            radius="0.100076mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.0127mm"
            pcbY="2.955927mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.6999951000000237, y: 2.199996100000021 },
              { x: 2.69999509999991, y: 2.199996100000021 },
              { x: 2.69999509999991, y: -2.199996100000021 },
              { x: -2.6999951000000237, y: -2.199996100000021 },
              { x: -2.6999951000000237, y: 2.199996100000021 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C473913.obj?uuid=b92c5708b0b84dc4a412331b9c6217c9",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C473913.step?uuid=b92c5708b0b84dc4a412331b9c6217c9",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.00012700000002041634,
          y: 0.0000762000000804619,
          z: 0,
        },
      }}
      {...props}
    />
  )
}
