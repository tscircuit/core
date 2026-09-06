import Board from "./index.circuit"

export default ({
  mcuSubcircuit = true,
  routeClockFirst = false,
  psramCapEscape = false,
  mcuPassiveEscape = false,
  clockPassiveEscape = false,
  westDecouplerEscape = false,
  eastSupplyCapEscape = false,
  clockResistorEscape = false,
  sdDetectEscape = false,
  debugTestpointEscape = false,
  flashCapEscape = false,
  usbResistorEscape = false,
  segmentedSupplyPours = false,
}: {
  mcuSubcircuit?: boolean
  routeClockFirst?: boolean
  psramCapEscape?: boolean
  mcuPassiveEscape?: boolean
  clockPassiveEscape?: boolean
  westDecouplerEscape?: boolean
  eastSupplyCapEscape?: boolean
  clockResistorEscape?: boolean
  sdDetectEscape?: boolean
  debugTestpointEscape?: boolean
  flashCapEscape?: boolean
  usbResistorEscape?: boolean
  segmentedSupplyPours?: boolean
} = {}) => (
  <Board
    publishedMcuModule
    storage
    psramCapEscape={psramCapEscape}
    mcuPassiveEscape={mcuPassiveEscape}
    clockPassiveEscape={clockPassiveEscape}
    westDecouplerEscape={westDecouplerEscape}
    eastSupplyCapEscape={eastSupplyCapEscape}
    clockResistorEscape={clockResistorEscape}
    sdDetectEscape={sdDetectEscape}
    debugTestpointEscape={debugTestpointEscape}
    flashCapEscape={flashCapEscape}
    usbResistorEscape={usbResistorEscape}
    segmentedSupplyPours={segmentedSupplyPours}
    mcuHeaders={false}
    mcuSubcircuit={mcuSubcircuit}
    routeClockFirst={routeClockFirst}
    allGlobal
    layers={4}
    copperIslands={false}
    router="beta-pipeline9"
    effort="5x"
    edgeConnectors
    innerButtonContacts
    ldoOffset={{ x: -12, y: 0 }}
    powerOffsetY={-3}
    powerPlacements={{
      R_BOOST_EN_PULLUP: { pcbX: 1.5, pcbY: 26.25, pcbRotation: 90 },
      R_BAT_GATE_PULLUP: { pcbX: -11.5, pcbY: 17, pcbRotation: 90 },
      D_BAT_BOOST: { pcbX: 19, pcbY: 24, pcbRotation: 180 },
      R_BOOST_TOP: { pcbX: 11.5, pcbY: 18, pcbRotation: 90 },
      R_BOOST_BOT: { pcbX: 8.5, pcbY: 18, pcbRotation: 90 },
      R_USB_BOOST_OFF: { pcbX: 23, pcbY: 25, pcbRotation: 90 },
      Q_USB_BOOST_OFF: { pcbX: 27, pcbY: 18.25, pcbRotation: 0 },
      R_USB_BOOST_OFF_PULLDOWN: { pcbX: 25, pcbY: 27, pcbRotation: 90 },
    }}
    usbDiodeOffset={{ x: -13, y: -2 }}
    audioVrefPlacement={{ pcbX: 16.7, pcbY: -13, pcbRotation: 90 }}
    audioPlacements={{
      R_AMP_IN: { pcbX: 9.4, pcbY: 0, pcbRotation: -90 },
      C_AMP_PWM_FILTER: { pcbX: 11, pcbY: 0, pcbRotation: 90 },
      C_AMP_IN_COUPLE: { pcbX: 10, pcbY: -7, pcbRotation: 0 },
      C_AMP_VDD: { pcbX: 22, pcbY: -8, pcbRotation: -90 },
      C_AMP_VDD_BULK: { pcbX: 22.5, pcbY: -3, pcbRotation: -90 },
      FB_SPK_POS: { pcbX: 18, pcbY: 9, pcbRotation: 90 },
    }}
    powerSwitchX={62}
    topLeftMountingHole={{ x: -58, y: -34 }}
  />
)
