import { expect, test } from "bun:test"
import { enclosure } from "lib/namespaced-elements"

test("types namespaced enclosure props", () => {
  const element = <enclosure.fdm.box boardRef=".main-board" />

  expect(element.type).toBe(enclosure.fdm.box)

  const capitalizedElement = <enclosure.fdm.Box boardRef="main-board" />
  expect(capitalizedElement.type).toBe(enclosure.fdm.Box)

  const aperture = (
    <enclosure.cutoutaperture shape="circle" radius="2mm" margin="0.2mm" />
  )
  expect(aperture.type).toBe(enclosure.cutoutaperture)
})

const missingBoardRef = (
  // @ts-expect-error boardRef is required
  <enclosure.fdm.box />
)
void missingBoardRef
