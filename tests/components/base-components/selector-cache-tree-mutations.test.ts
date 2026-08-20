import { expect, test } from "bun:test"
import { Group, Port } from "lib"

test("selector caches invalidate only after component tree mutations", () => {
  const subcircuit = new Group({ name: "root", subcircuit: true })
  const component = new Group({ name: "G1" })
  const port1 = new Port({ pinNumber: 1 })
  const port2 = new Port({ pinNumber: 2 })

  subcircuit.add(component)
  component.add(port1)

  const cachedComponentPorts = component.selectAll("port")
  const cachedSubcircuitPorts = subcircuit.selectAll("port")
  expect(component.selectAll("port")).toBe(cachedComponentPorts)
  expect(subcircuit.selectAll("port")).toBe(cachedSubcircuitPorts)

  component.add(port2)

  const portsAfterAdd = component.selectAll("port")
  const subcircuitPortsAfterAdd = subcircuit.selectAll("port")
  expect(portsAfterAdd).not.toBe(cachedComponentPorts)
  expect(portsAfterAdd).toEqual([port1, port2])
  expect(subcircuitPortsAfterAdd).not.toBe(cachedSubcircuitPorts)
  expect(subcircuitPortsAfterAdd).toEqual([port1, port2])

  expect(component.selectOne<Port>("port")).toBe(port1)
  component.remove(port1)
  expect(component.selectOne<Port>("port")).toBe(port2)
})
