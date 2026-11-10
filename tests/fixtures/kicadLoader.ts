import jstPhSm4Footprint from "./assets/external-jst-ph-sm4-footprint.json"
import keystone3002Footprint from "./assets/external-keystone-3002-footprint.json"
import usb3AFootprint from "./assets/external-usb3-a-footprint.json"

export const kicadLoader = async (footprintName: string) => {
  let rawFootprint: any[] | null = null

  if (
    footprintName ===
    "Connector_JST/JST_PH_B2B-PH-SM4-TB_1x02-1MP_P2.00mm_Vertical"
  ) {
    rawFootprint = jstPhSm4Footprint
  } else if (footprintName === "Connector_USB/USB3_A_Molex_48393-001") {
    rawFootprint = usb3AFootprint
  } else if (
    footprintName === "Battery/BatteryHolder_Keystone_3002_1x2032" ||
    footprintName === "Battery_Holders/BatteryHolder_Keystone_3002_1x2032" ||
    footprintName === "BatteryHolder_Keystone_3002_1x2032"
  ) {
    rawFootprint = keystone3002Footprint
  }

  if (rawFootprint) {
    const filtered = rawFootprint.filter((el) => {
      if (el?.type === "pcb_silkscreen_text") {
        return el?.text === "REF**"
      }
      return true
    })
    return { footprintCircuitJson: filtered }
  }

  throw new Error(`Footprint "${footprintName}" not found in local mock`)
}
