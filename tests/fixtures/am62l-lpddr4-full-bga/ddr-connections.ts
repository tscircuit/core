export type DdrBusName = "DDR_BYTE0" | "DDR_BYTE1" | "DDR_ADDR_CTRL"

export interface DdrConnection {
  socSignal: string
  memorySignal: string
  traceName: string
  busName: DdrBusName
}

export const DDR_CONNECTIONS: readonly DdrConnection[] = [
  ...Array.from({ length: 8 }, (_, bit) => ({
    socSignal: `DDR0_DQ${bit}`,
    memorySignal: `DQ${bit}`,
    traceName: `DQ${bit}`,
    busName: "DDR_BYTE0" as const,
  })),
  ...Array.from({ length: 8 }, (_, offset) => {
    const bit = offset + 8
    return {
      socSignal: `DDR0_DQ${bit}`,
      memorySignal: `DQ${bit}`,
      traceName: `DQ${bit}`,
      busName: "DDR_BYTE1" as const,
    }
  }),
  {
    socSignal: "DDR0_DM0",
    memorySignal: "DMI0",
    traceName: "DM0",
    busName: "DDR_BYTE0",
  },
  {
    socSignal: "DDR0_DM1",
    memorySignal: "DMI1",
    traceName: "DM1",
    busName: "DDR_BYTE1",
  },
  {
    socSignal: "DDR0_DQS0",
    memorySignal: "DQS0_t",
    traceName: "DQS0",
    busName: "DDR_BYTE0",
  },
  {
    socSignal: "DDR0_DQS0_n",
    memorySignal: "DQS0_c",
    traceName: "DQS0_n",
    busName: "DDR_BYTE0",
  },
  {
    socSignal: "DDR0_DQS1",
    memorySignal: "DQS1_t",
    traceName: "DQS1",
    busName: "DDR_BYTE1",
  },
  {
    socSignal: "DDR0_DQS1_n",
    memorySignal: "DQS1_c",
    traceName: "DQS1_n",
    busName: "DDR_BYTE1",
  },
  ...Array.from({ length: 6 }, (_, bit) => ({
    socSignal: `DDR0_A${bit}`,
    memorySignal: `CA${bit}`,
    traceName: `A${bit}`,
    busName: "DDR_ADDR_CTRL" as const,
  })),
  {
    socSignal: "DDR0_CS0_n",
    memorySignal: "CS",
    traceName: "CS0_n",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_CKE0",
    memorySignal: "CKE",
    traceName: "CKE0",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_CK0",
    memorySignal: "CK_t",
    traceName: "CK0",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_CK0_n",
    memorySignal: "CK_c",
    traceName: "CK0_n",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_RESET0_n",
    memorySignal: "RESET_n",
    traceName: "DDR_LINK_RESET0_n",
    busName: "DDR_ADDR_CTRL",
  },
]

export const DDR_SOC_PHYSICAL_PINS = [
  76, 91, 92, 93, 94, 103, 104, 105, 121, 122, 123, 124, 125, 139, 140, 149,
  150, 162, 164, 165, 215, 216, 236, 238, 255, 256, 257, 272, 273, 275, 276,
  284, 285,
] as const

export const DDR_BYTE0_TRACE_NAMES = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE0",
).map(({ traceName }) => traceName)

export const DDR_BYTE1_TRACE_NAMES = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE1",
).map(({ traceName }) => traceName)

export const DDR_ADDR_CTRL_TRACE_NAMES = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_ADDR_CTRL",
).map(({ traceName }) => traceName)
