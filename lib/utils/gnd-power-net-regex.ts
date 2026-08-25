// Power and ground aliases can be the entire net name or an underscore-delimited
// part of a more specific name, such as MCU_VSYS or USB_GND.
export const GROUND_NET_REGEX = /(?:^|_)(?:GND|AGND|DGND|PGND|VSS)/i
export const POWER_NET_REGEX = /(?:^|_)(?:V(?!SS)|\d+(?:[_.]\d+)?V)/i
