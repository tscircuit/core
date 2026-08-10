export const logicTrace = {
  thickness: "0.25mm",
  routingPhaseIndex: 0,
} as const
export const powerTrace = {
  thickness: "1mm",
  routingPhaseIndex: 0,
} as const
export const motorTrace = {
  thickness: "1mm",
  routingPhaseIndex: 0,
} as const

export const schematicSheets = {
  controller: "controller",
  programming: "controller_programming",
  motorDriver: "motor_driver",
  motorPower: "motor_power",
} as const

export const schematicSections = {
  driverCore: "motor_driver_core",
  motorOutputs: "motor_driver_outputs",
  pdNegotiation: "motor_power_pd_negotiation",
  pdFiltering: "motor_power_filtering",
} as const
