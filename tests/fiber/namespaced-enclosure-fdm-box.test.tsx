import { expect, test } from "bun:test"
import { EnclosureCutoutAperture, EnclosureFdmBox } from "lib/components"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { enclosure } from "lib/namespaced-elements"
import "lib/register-catalogue"

test("creates namespaced enclosure instances", () => {
  const element = <enclosure.fdm.box boardRef=".main-board" />
  const instance = createInstanceFromReactElement(element)

  expect(instance).toBeInstanceOf(EnclosureFdmBox)
  expect(instance._parsedProps).toEqual({
    boardRef: ".main-board",
    wallThickness: 2,
  })
  expect(
    createInstanceFromReactElement(
      <enclosure.fdm.Box boardRef=".main-board" />,
    ),
  ).toBeInstanceOf(EnclosureFdmBox)

  const aperture = createInstanceFromReactElement(
    <enclosure.cutoutaperture shape="pill" width="9mm" height="3.6mm" />,
  )
  expect(aperture).toBeInstanceOf(EnclosureCutoutAperture)
})
