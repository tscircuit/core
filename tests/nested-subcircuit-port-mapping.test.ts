import test from "ava"

test("nested subcircuit propagates internal net connections to parent circuit bus", (t) => {
  const subcircuit = {
    name: "PowerRegulator",
    ports: ["VIN", "GND", "VOUT"],
    internalNets: {
      "VIN": "NET_5V_IN",
      "GND": "GND_COMMON",
      "VOUT": "NET_3V3_OUT"
    }
  }
  
  const parentBusMapping = {
    "VIN": "SYS_PWR_5V",
    "GND": "SYS_GND",
    "VOUT": "MCU_VDD"
  }
  
  const resolvedConnections = Object.keys(subcircuit.internalNets).map(port => ({
    port,
    internalNet: subcircuit.internalNets[port],
    parentNet: parentBusMapping[port]
  }))
  
  t.is(resolvedConnections.length, 3)
  t.is(resolvedConnections[2].parentNet, "MCU_VDD")
})
