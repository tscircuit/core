import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import React from "react"
import { Circuit } from "../../lib"
import T113LinuxBoard from "../fixtures/t113-linux-exact/index.circuit"

test("exact T113 routing groups expose their misplaced bounds", async () => {
  const circuit = new Circuit({ platform: { useCloudAutorouter: false } })
  circuit.add(React.createElement(T113LinuxBoard))
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const groups = circuitJson.filter((element) => element.type === "pcb_group")
  const getGroup = (name: string) => {
    const group = groups.find((candidate) => candidate.name === name)
    if (!group) throw new Error(`Missing exact T113 routing group ${name}`)
    return group
  }

  expect(
    circuitJson.filter((element) => element.type === "source_component"),
  ).toHaveLength(96)

  const buck = getGroup("BUCK")
  const supervisor33 = getGroup("SUP33")
  const regulator18 = getGroup("REG18")
  const usb = getGroup("USB")

  const expectCenteredOnAnchor = (group: ReturnType<typeof getGroup>) => {
    const anchorPosition = group.anchor_position
    if (!anchorPosition) {
      throw new Error(
        `Missing anchor position for exact T113 group ${group.name}`,
      )
    }
    expect(group.center).toEqual(anchorPosition)
  }

  expectCenteredOnAnchor(buck)
  expectCenteredOnAnchor(supervisor33)
  expectCenteredOnAnchor(regulator18)
  expectCenteredOnAnchor(usb)

  const placementErrors = circuitJson.filter(
    (element) => element.type === "pcb_placement_error",
  )
  expect(placementErrors).toHaveLength(1)
  expect(placementErrors[0]?.message).toContain(
    'Fanout boundaries "REG18" and "USB" overlap',
  )

  await expect(
    convertCircuitJsonToPcbSvg(circuitJson, {
      showPcbGroups: true,
    }),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "t113-linux-routing-group-bounds-pcb",
    {
      diffThresholdPercent: 0.02,
    },
  )
}, 360_000)
