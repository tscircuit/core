// Power and ground aliases can be the entire net name or an underscore-delimited
// part of a more specific name, such as MCU_VSYS or USB_GND.
export const GROUND_NET_REGEX = /(?:^|_)(?:GND|AGND|DGND|PGND|VSS)/i
export const POWER_NET_REGEX = /(?:^|_)(?:V(?!SS)|\d+(?:[_.]\d+)?V)/i

// Power nets include output rails, but automatic decoupling applies only to
// recognizable supply-input pins. Reference, bias, and output pins such as
// VREG, VCM, and VOUT require a separate rule.
export const DECOUPLING_POWER_PIN_REGEX =
  /(?:^|_)(?:[ADP]?V(?:CC|DD|IN|BAT|BUS|SYS|CORE|IO)[A-Z0-9_]*|V\d+(?:_\d+)?|\d+V\d*)(?:$|_)/i
