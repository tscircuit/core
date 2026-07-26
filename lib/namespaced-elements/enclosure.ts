import type {
  EnclosureCutoutApertureProps,
  EnclosureFdmBoxProps,
} from "@tscircuit/props"
import { createNamespacedElement } from "./create-namespaced-element"

const EnclosureFdmBoxElement =
  createNamespacedElement<EnclosureFdmBoxProps>("enclosure.fdm.box")

export const enclosure = {
  cutoutaperture: createNamespacedElement<EnclosureCutoutApertureProps>(
    "enclosure.cutoutaperture",
  ),
  fdm: {
    box: EnclosureFdmBoxElement,
    Box: EnclosureFdmBoxElement,
  },
} as const
