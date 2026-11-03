// Original six-layer Pocket Audio Player source; only local data imports are adapted.
/*
### KiCad Libraries License

The KiCad libraries are licensed under the [Creative Commons CC-BY-SA 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/legalcode), with the following exception:

---------

_To the extent that the creation of electronic designs that use 'Licensed Material' can be considered to be 'Adapted Material', then the copyright holder waives article 3 of the license with respect to these designs and any generated files which use data provided as part of the 'Licensed Material'._

---------

You can read more about KiCad library licensing [here](http://kicad-pcb.org/libraries/license).

**What does this mean?**

KiCad libraries are licensed in such a way to ensure free use of library data for commercial, closed, and non-commercial projects without restriction. KiCad does not wish to exert any control over designs produced using the library data, or force users to reveal proprietary information contained in their designs. Neither do we wish to force users to attribute the KiCad libraries _within their design_.

Use of the library data in a project does not (by itself) require that the design or any files generated from the design are licensed under the CC-BY-SA 4.0 License. You are free to use the library data in your own projects without the obligation to share your project files under this or any other license agreement.

However, if you wish to redistribute the KiCad libraries, or parts thereof (including in modified form) as a collection then the exception above does not apply. Redistributed library collections must be shared under the same license agreement. Under these circumstances, the libraries must also retain attribution information, including the license documents which are distributed with the library files.

----------------------

**Warranty**

The KiCad libraries are provided in the hope that they will be useful, but are provided without warranty of any kind, express or implied.

The KiCad libraries are compiled by the KiCad community - if you find an error in the library data, please help the community and contribute a fix!
*/
import { createLocalAutorouter } from "./lib/local-autorouter"
import { Processor } from "./lib/processor"
import { Power } from "./lib/power"
import { Audio } from "./lib/audio"
import { UsbHeadphones } from "./lib/usb-headphones"
import { DisplayStorageControls } from "./lib/display-storage-controls"
import { Fragment, type ReactElement, type ReactNode } from "react"
import { UsbRouting } from "./lib/usb-routing"
import type { BoardProps, FanoutTracePath } from "@tscircuit/props"
import savedPowerRouteJson from "./routing/power-routes"
import { fanoutTracePath } from "@tscircuit/props"
import supplyDropJson from "./routing/supply-drops"
import groundDropJson from "./routing/ground-drops"
import savedCopperJson from "./routing/copper-results"
import { parseSavedCopperRecord } from "./lib/saved-autorouter"

const powerNets = [
  "V3V3",
  "BOOST_SW",
  "BUCK_L2",
  "BUCK_L1",
  "CHARGE_VBUS",
  "CHARGE_5V",
  "VBAT",
  "VSYS",
  "A3V3",
  "BOOST_5V",
  "USB_VBUS",
]

const signalNets = [
  "AMP_CPN",
  "AMP_CPP",
  "AMP_HPVDD",
  "AMP_HPVSS",
  "AMP_LEFT",
  "AMP_RIGHT",
  "AUDIO_ENABLE",
  "BAT_ADC",
  "BAT_NTC",
  "BOOST_FB",
  "BOOT",
  "BTN_NEXT",
  "BTN_PLAY",
  "BTN_POWER",
  "BTN_PREV",
  "BTN_VOL_DOWN",
  "BTN_VOL_UP",
  "BUCK_FB",
  "CHARGE_CC1",
  "CHARGE_CC2",
  "CHARGE_ILIM",
  "CHARGE_ISET",
  "CHARGE_LED_A",
  "CHARGE_N",
  "CHARGE_TMR",
  "DAC_CAPM",
  "DAC_CAPP",
  "DAC_LDO",
  "DAC_LEFT",
  "DAC_RIGHT",
  "DAC_VNEG",
  "HOST_CC1",
  "HOST_CC2",
  "HP_LEFT",
  "HP_RIGHT",
  "I2C_SCL",
  "I2C_SDA",
  "I2S_BCLK",
  "I2S_DOUT",
  "I2S_LRCLK",
  "INPUT_LED_A",
  "LCD_BL",
  "LCD_CLK",
  "LCD_CS",
  "LCD_DC",
  "LCD_MOSI",
  "LCD_RST",
  "MCU_EN",
  "PGOOD_N",
  "POWER_LED_A",
  "SD_CLK",
  "SD_CS",
  "SD_DAT1",
  "SD_DAT2",
  "SD_DETECT",
  "SD_MISO",
  "SD_MOSI",
  "UART_RX",
  "UART_TX",
  "USB_ATTACHED_N",
  "USB_CC_INT_N",
  "USB_DM",
  "USB_DM_MCU",
  "USB_DP",
  "USB_DP_MCU",
  "USB_ENABLE",
  "USB_FAULT_N",
  "USB_ILIM",
  "USB_LED_A",
  "VBUS_SENSE",
]
const fixedUsbNets = new Set(["USB_DM", "USB_DM_MCU", "USB_DP", "USB_DP_MCU"])

const savedPowerRoutes: Record<string, FanoutTracePath[]> = Object.fromEntries(
  Object.entries(savedPowerRouteJson).map(([name, paths]) => [
    name,
    paths.map((path) => fanoutTracePath.parse(path)),
  ]),
)

const supplyDrops = supplyDropJson.map((path) => fanoutTracePath.parse(path))

const groundDrops = groundDropJson.map((path) => fanoutTracePath.parse(path))
const savedCopper = parseSavedCopperRecord(savedCopperJson)

export default function PocketAudioPlayer(): ReactElement<
  BoardProps & { children?: ReactNode }
> {
  return (
    <board
      title="Pocket Audio Player"
      width="55mm"
      height="85mm"
      thickness="1.6mm"
      layers={6}
      routeRemaining={false}
      defaultViaTenting="both_sides"
      minViaHoleEdgeToViaHoleEdgeClearance="0.2mm"
      minPlatedHoleDrillEdgeToDrillEdgeClearance="0.45mm"
      schLayout={{ layoutMode: "none" }}
      schTraceAutoLabelEnabled
      schMaxTraceDistance="1mm"
      autorouter={{
        preset: "auto_local",
        traceClearance: "0.15mm",
        allowViaInPad: true,
      }}
      pcbStyle={{
        viaHoleDiameter: "0.2mm",
        viaPadDiameter: "0.4mm",
        silkscreenFontSize: "0.8mm",
      }}
    >
      <net
        name="GND"
        isGroundNet
        nominalTraceWidth="0.4mm"
        routingPhaseIndex={0}
      />
      {powerNets.map((name, index) => (
        <Fragment key={name}>
          <net
            name={name}
            isPowerNet
            nominalTraceWidth="0.5mm"
            routingPhaseIndex={index + 1}
          />
        </Fragment>
      ))}
      {signalNets.map((name, index) => (
        <Fragment key={name}>
          <net
            name={name}
            routingPhaseIndex={
              fixedUsbNets.has(name) ? undefined : index + powerNets.length + 1
            }
          />
        </Fragment>
      ))}
      <keepout
        shape="rect"
        pcbX={0}
        pcbY={40}
        width="24mm"
        height="6mm"
        layers={["top", "inner1", "inner2", "inner3", "inner4", "bottom"]}
        excludeRefs={[".U1"]}
      />
      <copperpour
        name="ground_reference"
        layer="inner1"
        connectsTo="net.GND"
        unbroken
        clearance="0.2mm"
        boardEdgeMargin="0.3mm"
        useThermalReliefs
        outline={[
          { x: -27, y: -42 },
          { x: 27, y: -42 },
          { x: 27, y: 36.7 },
          { x: -27, y: 36.7 },
        ]}
      />
      <copperpour
        name="bottom_ground_reference"
        layer="inner4"
        connectsTo="net.GND"
        unbroken
        clearance="0.2mm"
        boardEdgeMargin="0.3mm"
        useThermalReliefs
        outline={[
          { x: -27, y: -42 },
          { x: 27, y: -42 },
          { x: 27, y: 36.7 },
          { x: -27, y: 36.7 },
        ]}
      />
      <copperpour
        name="module_thermal_ground"
        layer="bottom"
        connectsTo="net.GND"
        clearance="0.2mm"
        useThermalReliefs
        outline={[
          { x: -0.6, y: 26.2 },
          { x: 3.6, y: 26.2 },
          { x: 3.6, y: 30.5 },
          { x: -0.6, y: 30.5 },
        ]}
      />
      <copperpour
        name="supply_reference"
        layer="inner3"
        connectsTo="net.V3V3"
        unbroken
        clearance="0.2mm"
        boardEdgeMargin="0.3mm"
        useThermalReliefs
        outline={[
          { x: -27, y: -42 },
          { x: 27, y: -42 },
          { x: 27, y: 36.7 },
          { x: -27, y: 36.7 },
        ]}
      />
      <autoroutingphase
        name="ground_plane_drops"
        phaseIndex={0}
        autorouter={{ preset: "fanout", allowViaInPad: true }}
        pcbTracePaths={groundDrops}
        fanoutRoutingLayers={["inner1"]}
        fanoutPourNetMap={{ inner1: "GND" }}
      />
      {[...powerNets, ...signalNets].map((name, index) =>
        fixedUsbNets.has(name) ? null : (
          <Fragment key={name}>
            {name === "V3V3" ? (
              <autoroutingphase
                name="supply_plane_drops"
                phaseIndex={index + 1}
                pcbTracePaths={supplyDrops}
                autorouter={{ preset: "fanout", allowViaInPad: false }}
                fanoutRoutingLayers={["inner3"]}
                fanoutPourNetMap={{ inner3: "V3V3" }}
              />
            ) : (
              <autoroutingphase
                name={`route_${name}`}
                phaseIndex={index + 1}
                pcbTracePaths={
                  savedCopper[name] ? undefined : savedPowerRoutes[name]
                }
                algorithmFn={(input) =>
                  createLocalAutorouter(input, savedCopper[name])
                }
                autorouter={{
                  preset: "auto_local",
                  traceClearance: "0.15mm",
                  allowViaInPad: false,
                }}
              />
            )}
          </Fragment>
        ),
      )}
      <Processor />
      <Power />
      <Audio />
      <UsbHeadphones />
      <DisplayStorageControls />
      <UsbRouting />
      <hole name="H1" pcbX={-24} pcbY={39} diameter="2.2mm" />
      <hole name="H2" pcbX={24} pcbY={39} diameter="2.2mm" />
      <hole name="H3" pcbX={-24} pcbY={-39} diameter="2.2mm" />
      <hole name="H4" pcbX={24} pcbY={-39} diameter="2.2mm" />
      {["top", "bottom"].map((layer, side) => (
        <Fragment key={layer}>
          <fiducial
            name={`FID${side * 3 + 1}`}
            pcbX={-24}
            pcbY={34}
            layer={layer === "top" ? "top" : "bottom"}
            padDiameter="1mm"
            soldermaskPullback="0.5mm"
            doNotPlace
          />
          <fiducial
            name={`FID${side * 3 + 2}`}
            pcbX={24}
            pcbY={34}
            layer={layer === "top" ? "top" : "bottom"}
            padDiameter="1mm"
            soldermaskPullback="0.5mm"
            doNotPlace
          />
          <fiducial
            name={`FID${side * 3 + 3}`}
            pcbX={-24}
            pcbY={-35}
            layer={layer === "top" ? "top" : "bottom"}
            padDiameter="1mm"
            soldermaskPullback="0.5mm"
            doNotPlace
          />
        </Fragment>
      ))}
      <silkscreentext text="PWR" pcbX={-25} pcbY={24.5} fontSize={1} />
      <silkscreentext text="CHG" pcbX={-23} pcbY={-33.5} fontSize={1} />
      <silkscreentext text="IN" pcbX={-3} pcbY={-38.5} fontSize={1} />
      <silkscreentext text="USB" pcbX={23} pcbY={-36.5} fontSize={1} />
      <silkscreentext text="CHARGE" pcbX={-14} pcbY={-32} fontSize={0.8} />
      <silkscreentext text="USB AUDIO" pcbX={14} pcbY={-31.5} fontSize={0.8} />
      <silkscreentext
        text="POCKET AUDIO v0.1"
        pcbX={0}
        pcbY={40}
        fontSize={0.8}
      />
    </board>
  )
}
