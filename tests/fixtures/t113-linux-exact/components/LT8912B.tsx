import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

const pins = [
  "MIPIRX0_DP",
  "MIPIRX0_DN",
  "MIPIRX1_DP",
  "MIPIRX1_DN",
  "VCCA_MIPIRX",
  "VSSA_MIPIRX",
  "MIPIRX_CKP",
  "MIPIRX_CKN",
  "MIPIRX2_DP",
  "MIPIRX2_DN",
  "MIPIRX3_DP",
  "MIPIRX3_DN",
  "R6K",
  "HPD_CBUS",
  "VBUS",
  "USB_ID",
  "VSS1",
  "VDD1",
  "USB_DP",
  "USB_DM",
  "HDMITX_CKN",
  "HDMITX_CKP",
  "VSSA_HDMITX1",
  "HDMITX0_DN",
  "HDMITX0_DP",
  "VCCA_HDMITX",
  "HDMITX1_DN",
  "HDMITX1_DP",
  "VSSA_HDMITX2",
  "HDMITX2_DN",
  "HDMITX2_DP",
  "VSS2",
  "VDD2",
  "VCCA_HDMIPLL",
  "LPF",
  "VSSA_HDMIPLL",
  "LVDSTX3_DP",
  "LVDSTX3_DN",
  "LVDSTX_CKP",
  "LVDSTX_CKN",
  "VCCA_LVDSTX",
  "VSSA_LVDSTX",
  "LVDSTX2_DP",
  "LVDSTX2_DN",
  "LVDSTX1_DP",
  "LVDSTX1_DN",
  "LVDSTX0_DP",
  "LVDSTX0_DN",
  "VSSA_SYSCLK",
  "VCCA_SYSCLK",
  "VSSA_LVDSPLL",
  "VCCA_LVDSPLL",
  "XTALI",
  "XTALO",
  "REFCLK",
  "VSS3",
  "VDD3",
  "SD0_CEC",
  "WS_I",
  "SCLK_I",
  "S_SDA",
  "S_SCL",
  "INT",
  "RESET_N",
  "GPAD",
] as const

const pinLabels = Object.fromEntries(
  pins.map((name, index) => [`pin${index + 1}`, [name]]),
)

const powerPins = [
  "VCCA_MIPIRX",
  "VDD1",
  "VDD2",
  "VDD3",
  "VCCA_HDMITX",
  "VCCA_HDMIPLL",
  "VCCA_LVDSTX",
  "VCCA_SYSCLK",
  "VCCA_LVDSPLL",
]
const groundPins = [
  "VSSA_MIPIRX",
  "VSS1",
  "VSSA_HDMITX1",
  "VSSA_HDMITX2",
  "VSS2",
  "VSSA_HDMIPLL",
  "VSSA_LVDSTX",
  "VSSA_SYSCLK",
  "VSSA_LVDSPLL",
  "VSS3",
  "GPAD",
]
const unusedPins = [
  "VBUS",
  "USB_ID",
  "USB_DP",
  "USB_DM",
  "LVDSTX3_DP",
  "LVDSTX3_DN",
  "LVDSTX_CKP",
  "LVDSTX_CKN",
  "LVDSTX2_DP",
  "LVDSTX2_DN",
  "LVDSTX1_DP",
  "LVDSTX1_DN",
  "LVDSTX0_DP",
  "LVDSTX0_DN",
  "XTALO",
  "SD0_CEC",
  "WS_I",
  "SCLK_I",
  "INT",
]

const pinAttributes: NonNullable<ChipProps["pinAttributes"]> = {
  ...Object.fromEntries(
    powerPins.map((name) => [name, { requiresPower: true }]),
  ),
  ...Object.fromEntries(
    groundPins.map((name) => [name, { requiresGround: true }]),
  ),
  ...Object.fromEntries(
    unusedPins.map((name) => [name, { doNotConnect: true }]),
  ),
}

const makePad = (
  pin: number,
  x: number,
  y: number,
  width: number,
  height: number,
) => (
  <Fragment key={`pin${pin}`}>
    <smtpad
      portHints={[`pin${pin}`]}
      pcbX={`${x}mm`}
      pcbY={`${y}mm`}
      width={`${width}mm`}
      height={`${height}mm`}
      shape="rect"
    />
  </Fragment>
)

const perimeterPads = [
  ...Array.from({ length: 16 }, (_, index) =>
    makePad(index + 1, -3.9, 3 - index * 0.4, 1.3, 0.2),
  ),
  ...Array.from({ length: 16 }, (_, index) =>
    makePad(index + 17, -3 + index * 0.4, -3.9, 0.2, 1.3),
  ),
  ...Array.from({ length: 16 }, (_, index) =>
    makePad(index + 33, 3.9, -3 + index * 0.4, 1.3, 0.2),
  ),
  ...Array.from({ length: 16 }, (_, index) =>
    makePad(index + 49, 3 - index * 0.4, 3.9, 0.2, 1.3),
  ),
]

type LT8912BProps = Omit<
  ChipProps<typeof pinLabels>,
  | "pinLabels"
  | "pinAttributes"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
  | "noConnect"
> & {
  noConnect?: readonly string[]
}

// Lontium LT8912B, JLCPCB C2892102. The JLC catalog part has no searchable
// EasyEDA component, so the copper below follows the manufacturer's exact
// Fig. 6.4 recommended QFN64 land pattern rather than a generic QFN footprint.
export const LT8912B = (props: LT8912BProps) => (
  <chip
    {...props}
    pinLabels={pinLabels}
    pinAttributes={pinAttributes}
    manufacturerPartNumber="LT8912B"
    supplierPartNumbers={{ jlcpcb: ["C2892102"] }}
    schWidth={14}
    schHeight={22}
    footprint={
      <footprint>
        {perimeterPads}
        <smtpad
          portHints={["pin65"]}
          pcbX="0mm"
          pcbY="0mm"
          width="6.2mm"
          height="6.2mm"
          shape="rect"
        />
        <silkscreenpath
          route={[
            { x: -3.75, y: 3.75 },
            { x: -3.2, y: 3.75 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 3.2, y: 3.75 },
            { x: 3.75, y: 3.75 },
            { x: 3.75, y: 3.2 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 3.75, y: -3.2 },
            { x: 3.75, y: -3.75 },
            { x: 3.2, y: -3.75 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -3.2, y: -3.75 },
            { x: -3.75, y: -3.75 },
            { x: -3.75, y: -3.2 },
          ]}
        />
        <silkscreencircle pcbX="-4.65mm" pcbY="3mm" radius="0.15mm" />
        <silkscreentext
          text="{NAME}"
          pcbX="0mm"
          pcbY="5.5mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <courtyardoutline
          outline={[
            { x: -4.8, y: 4.8 },
            { x: 4.8, y: 4.8 },
            { x: 4.8, y: -4.8 },
            { x: -4.8, y: -4.8 },
            { x: -4.8, y: 4.8 },
          ]}
        />
      </footprint>
    }
  />
)
