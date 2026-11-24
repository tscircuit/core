import React from "react"
import { IC, R, Title, Note, UsbC } from "./parts"
export function PcDataPort() {
  return (
    <>
      <schematicsheet name="pc_gadget" displayName="PC DATA / Linux USB device">
        <Title
          text="PC DATA — SELF-POWERED USB GADGET / NO VBUS BACKFEED"
          x={0}
          y={15}
        />
        <UsbC
          name="J2"
          label="PC DATA"
          vbus="PC_VBUS_SENSE"
          cc1="PC_CC1"
          cc2="PC_CC2"
          dp="PC_USB_DP"
          dm="PC_USB_DM"
          pcbX={-48}
          pcbY={45}
          pcbRotation={180}
          schX={-12}
          schY={1}
        />
        <R
          name="R3010"
          value="5.1k"
          a="PC_CC1"
          b="GND"
          pcbX={-53}
          pcbY={40}
          schX={2}
          schY={7}
        />
        <R
          name="R3011"
          value="5.1k"
          a="PC_CC2"
          b="GND"
          pcbX={-49}
          pcbY={40}
          schX={2}
          schY={2}
        />
        <IC
          name="D30"
          mpn="USBLC6-2SC6"
          pinNames={{
            1: "DM1",
            2: "GND",
            3: "DP1",
            4: "DP2",
            5: "VBUS",
            6: "DM2",
          }}
          connections={{
            1: "PC_USB_DM",
            2: "GND",
            3: "PC_USB_DP",
            4: "PC_USB_DP",
            5: "PC_VBUS_SENSE",
            6: "PC_USB_DM",
          }}
          pcbX={-44}
          pcbY={40}
          schX={16}
          schY={3}
          width={4}
        />
        <R
          name="R3012"
          value="100k"
          a="PC_VBUS_SENSE"
          b="PC_DETECT"
          pcbX={-40}
          pcbY={40}
          schX={3}
          schY={-6}
        />
        <R
          name="R3013"
          value="100k"
          a="PC_DETECT"
          b="GND"
          pcbX={-37}
          pcbY={40}
          schX={15}
          schY={-6}
        />
        <Note
          text="USBLC6-2: pins 1/6 and 3/4 are joined internally (ST DS4260). Companion leads need no separate PCB branch."
          schX={0}
          schY={-17}
        />
        <Note
          text="USBPHYC port 2 -> DWC2 peripheral. OTG_VBUS senses PC VBUS directly per AN5031 Fig.42; this is not a power input. Firmware must configure port 1 as host and port 2 as device."
          schX={0}
          schY={-15}
          fontSize={0.6}
        />
      </schematicsheet>
    </>
  )
}
