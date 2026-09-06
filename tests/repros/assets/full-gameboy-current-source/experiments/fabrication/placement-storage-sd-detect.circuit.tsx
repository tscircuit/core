import StorageBoard from "./placement-published-mcu-header-module.circuit"

// Put the existing low-speed card-detect pull-up near its MCU input, not a breakout.
export default () => (
  <StorageBoard
    mcuSubcircuit={false}
    psramCapEscape
    mcuPassiveEscape
    usbResistorEscape
    clockPassiveEscape
    westDecouplerEscape
    sdDetectEscape
  />
)
