import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CC1DB"],
  pin2: ["CC1"],
  pin3: ["NC"],
  pin4: ["CC2"],
  pin5: ["CC2DB"],
  pin6: ["RESET"],
  pin7: ["SCL"],
  pin8: ["SDA"],
  pin9: ["DISCH"],
  pin10: ["GND"],
  pin11: ["ATTACH"],
  pin12: ["ADDR0"],
  pin13: ["ADDR1"],
  pin14: ["POWER_OK3"],
  pin15: ["GPIO"],
  pin16: ["VBUS_EN_SNK"],
  pin17: ["A_B_SIDE"],
  pin18: ["VBUS_VS_DISCH"],
  pin19: ["ALERT"],
  pin20: ["POWER_OK2"],
  pin21: ["VREG_1V2"],
  pin22: ["VSYS"],
  pin23: ["VREG_2V7"],
  pin24: ["VDD"],
  pin25: ["EP"],
} as const

const pinAttributes = {
  pin3: { doNotConnect: true },
  pin10: { requiresGround: true },
  pin24: { requiresPower: true },
  pin1: { isBidirectional: true },
  pin2: { isBidirectional: true },
  pin4: { isBidirectional: true },
  pin5: { isBidirectional: true },
  pin6: { isInput: true },
  pin7: { isInput: true, capabilities: ["i2c_scl"], needsExternalPullup: true },
  pin8: {
    isBidirectional: true,
    capabilities: ["i2c_sda"],
    needsExternalPullup: true,
    canUseOpenDrain: true,
  },
  pin9: { isBidirectional: true, canUseOpenDrain: true },
  pin11: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin12: { isInput: true },
  pin13: { isInput: true },
  pin14: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin15: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin16: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin17: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin18: { isBidirectional: true },
  pin19: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin20: { isOutput: true, needsExternalPullup: true, canUseOpenDrain: true },
  pin21: {
    isOutput: true,
    providesVoltage: "1.2V",
    shouldHaveDecouplingCapacitor: true,
    recommendedDecouplingCapacitorCapacitance: "1uF",
  },
  pin22: { requiresPower: true },
  pin23: {
    isOutput: true,
    providesVoltage: "2.7V",
    shouldHaveDecouplingCapacitor: true,
    recommendedDecouplingCapacitorCapacitance: "1uF",
  },
  pin25: { requiresGround: true },
} satisfies NonNullable<ChipProps["pinAttributes"]>

export const STUSB4500QTR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C2678061"],
      }}
      manufacturerPartNumber="STUSB4500QTR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.249934mm"
            pcbY="-1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.750062mm"
            pcbY="-1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-0.249936mm"
            pcbY="-1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.249936mm"
            pcbY="-1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0.750062mm"
            pcbY="-1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="1.249934mm"
            pcbY="-1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="1.999996mm"
            pcbY="-1.249934mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="1.999996mm"
            pcbY="-0.750062mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.999996mm"
            pcbY="-0.249936mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.999996mm"
            pcbY="0.249936mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="1.999996mm"
            pcbY="0.750062mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="1.999996mm"
            pcbY="1.249934mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="1.249934mm"
            pcbY="1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="0.750062mm"
            pcbY="1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="0.249936mm"
            pcbY="1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="-0.249936mm"
            pcbY="1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="-0.750062mm"
            pcbY="1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="-1.249934mm"
            pcbY="1.999996mm"
            width="0.2800096mm"
            height="0.6999986mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="-1.999996mm"
            pcbY="1.249934mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="-1.999996mm"
            pcbY="0.750062mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="-1.999996mm"
            pcbY="0.249936mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="-1.999996mm"
            pcbY="-0.249936mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="-1.999996mm"
            pcbY="-0.750062mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="-1.999996mm"
            pcbY="-1.249934mm"
            width="0.6999986mm"
            height="0.2800096mm"
            radius="0.1400048mm"
            shape="pill"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="0.0127mm"
            pcbY="0mm"
            width="2.7999944mm"
            height="2.7999944mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 2.1628099999998085, y: 1.7500345999999354 },
              { x: 2.1628099999998085, y: 2.1501353999999537 },
              { x: 1.7627599999999575, y: 2.1501353999999537 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.137384599999905, y: 1.7500345999999354 },
              { x: -2.137384599999905, y: 2.1501353999999537 },
              { x: -1.737359999999967, y: 2.1501353999999537 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.737359999999967, y: -2.1501353999999537 },
              { x: -2.137384599999905, y: -2.1501353999999537 },
              { x: -2.137384599999905, y: -1.750085399999989 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 2.1628099999998085, y: -1.750085399999989 },
              { x: 2.1628099999998085, y: -2.1501353999999537 },
              { x: 1.7627599999999575, y: -2.1501353999999537 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0mm"
            pcbY="3.343404mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.599995300000046, y: 2.599995300000046 },
              { x: 2.5999953000001597, y: 2.599995300000046 },
              { x: 2.5999953000001597, y: -2.599995300000046 },
              { x: -2.599995300000046, y: -2.599995300000046 },
              { x: -2.599995300000046, y: 2.599995300000046 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2678061.obj?uuid=f4a3249710724deb990f62f343cd4553",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2678061.step?uuid=f4a3249710724deb990f62f343cd4553",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: -0.000012699999842880061,
          y: -0.000012700000070253736,
          z: 0,
        },
      }}
      {...props}
    />
  )
}
