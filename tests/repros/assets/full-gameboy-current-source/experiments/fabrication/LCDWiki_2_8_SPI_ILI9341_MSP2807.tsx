import { B254N02_0B14P51_H85C32 } from "./imports/B254N02_0B14P51_H85C32"

type LCDWikiMsp2807Props = {
  name: string
  schSectionName?: string
  layer?: "top" | "bottom"
  pcbX?: string | number
  pcbY?: string | number
  pcbRotation?: string | number
  schX?: string | number
  schY?: string | number
  schRotation?: string | number
}

const pinLabels = {
  pin1: "VCC",
  pin2: "GND",
  pin3: "CS",
  pin4: "RESET",
  pin5: "DC_RS",
  pin6: "SDI_MOSI",
  pin7: "SCK",
  pin8: "LED",
  pin9: "SDO_MISO",
  pin10: "T_CLK",
  pin11: "T_CS",
  pin12: "T_DIN",
  pin13: "T_DO",
  pin14: "T_IRQ",
} as const

const pcbWidth = "86mm"
const pcbHeight = "50mm"
const holeX = "38.04mm"
const holeY = "22mm"
const mountingHoleDiameter = "3.2mm"
const mountingHoleOuterDiameter = "4.7mm"
const activeAreaX = "-4.9mm"

const DisplayHeader = ({
  schSectionName,
  layer,
}: {
  schSectionName?: string
  layer: "top" | "bottom"
}) => (
  <B254N02_0B14P51_H85C32
    name="J_HEADER"
    schSectionName={schSectionName}
    layer={layer}
    pitch="2.54mm"
    gender="female"
    pinLabels={pinLabels}
    pinAttributes={{
      T_CLK: { doNotConnect: true },
      T_CS: { doNotConnect: true },
      T_DIN: { doNotConnect: true },
      T_DO: { doNotConnect: true },
      T_IRQ: { doNotConnect: true },
    }}
    pcbPinLabels={pinLabels}
    schWidth={0.96}
    pcbRotation={90}
    pcbX="41mm"
    pcbY="0mm"
  />
)

const DisplayMountingHoles = () => (
  <>
    <platedhole
      pcbX={`-${holeX}`}
      pcbY={holeY}
      shape="circle"
      holeDiameter={mountingHoleDiameter}
      outerDiameter={mountingHoleOuterDiameter}
    />
    <platedhole
      pcbX={holeX}
      pcbY={holeY}
      shape="circle"
      holeDiameter={mountingHoleDiameter}
      outerDiameter={mountingHoleOuterDiameter}
    />
    <platedhole
      pcbX={`-${holeX}`}
      pcbY={`-${holeY}`}
      shape="circle"
      holeDiameter={mountingHoleDiameter}
      outerDiameter={mountingHoleOuterDiameter}
    />
    <platedhole
      pcbX={holeX}
      pcbY={`-${holeY}`}
      shape="circle"
      holeDiameter={mountingHoleDiameter}
      outerDiameter={mountingHoleOuterDiameter}
    />
  </>
)

const DisplaySilkscreen = () => (
  <>
    <silkscreenrect pcbX="0mm" pcbY="0mm" width={pcbWidth} height={pcbHeight} />
    <silkscreenrect
      pcbX={activeAreaX}
      pcbY="0mm"
      width="57.6mm"
      height="43.2mm"
    />
    <silkscreentext
      text="{NAME}"
      pcbX="0mm"
      pcbY="24mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
    <silkscreentext
      text="LCDWIKI 2.8 SPI ILI9341"
      pcbX="4mm"
      pcbY="-24mm"
      anchorAlignment="center"
      fontSize="1mm"
    />
  </>
)

export const LCDWiki_2_8_SPI_ILI9341_MSP2807 = ({
  name,
  schSectionName,
  layer = "top",
  ...props
}: LCDWikiMsp2807Props) => (
  <group name={name} {...props}>
    <DisplayHeader schSectionName={schSectionName} layer={layer} />
    <DisplayMountingHoles />
    <DisplaySilkscreen />
  </group>
)
