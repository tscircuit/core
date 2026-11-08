import type { ReactNode } from "react"
import type { IbisModelProps } from "@tscircuit/props"

export const lvcModel = {
  ibisModelAsset: {
    project_relative_path: "models/sn74lvc1g04.ibs",
    url: "./models/sn74lvc1g04.ibs",
    mimetype: "text/plain",
  },
  ibisComponentName: "LVC1G04_DCK",
  ibisPinNameToPortLabel: { "2": "A", "3": "GND", "4": "Y", "5": "VCC" },
  ibisPinNameToModelName: { "2": "LVC1G04_IN_33", "4": "LVC1G04_OUT_33" },
} satisfies Omit<IbisModelProps, "componentRef">

export const busModel = {
  ibisModelAsset: {
    project_relative_path: "models/sn65hvd72.ibs",
    url: "./models/sn65hvd72.ibs",
    mimetype: "text/plain",
  },
  ibisComponentName: "SN65HVD72D",
  ibisPinNameToPortLabel: { "5": "GND", "6": "A", "7": "B", "8": "VCC" },
  ibisPinNameToModelName: { "6": "a_b_p", "7": "a_b_n" },
} satisfies Omit<IbisModelProps, "componentRef">

export const lvcPins = {
  pin1: "NC",
  pin2: "A",
  pin3: "GND",
  pin4: "Y",
  pin5: "VCC",
}
export const busPins = {
  pin1: "R",
  pin2: "RE",
  pin3: "DE",
  pin4: "D",
  pin5: "GND",
  pin6: "A",
  pin7: "B",
  pin8: "VCC",
}

export function DiagnosticBoard({
  children,
  missingModel,
  disconnected,
  stackup = true,
}: {
  children: ReactNode
  missingModel?: "TX" | "RX"
  disconnected?: boolean
  stackup?: boolean
}) {
  return (
    <board
      width="40mm"
      height="20mm"
      routingDisabled
      fabricatorPreset={stackup ? "jlcpcb_standard" : undefined}
    >
      <chip name="TX" footprint="sot23_5" pcbX={-12} pinLabels={lvcPins} />
      <chip name="RX" footprint="sot23_5" pcbX={12} pinLabels={lvcPins} />
      {missingModel !== "TX" && <ibismodel componentRef=".TX" {...lvcModel} />}
      {missingModel !== "RX" && <ibismodel componentRef=".RX" {...lvcModel} />}
      {!disconnected && <trace from=".TX > .Y" to=".RX > .A" />}
      {children}
    </board>
  )
}
