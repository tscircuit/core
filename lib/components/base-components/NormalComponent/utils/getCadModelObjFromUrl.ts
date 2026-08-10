import type {
  CadModelGlb,
  CadModelGltf,
  CadModelObj,
  CadModelStep,
  CadModelStl,
  CadModelWrl,
} from "@tscircuit/props"
import { getFileExtension } from "./getFileExtension"

type CadModelUrlObj =
  | CadModelStl
  | CadModelObj
  | CadModelGltf
  | CadModelGlb
  | CadModelStep
  | CadModelWrl

/**
 * Converts the string URL shorthand of `cadModel` into the object form the
 * render logic expects. The matching `*Url` field is chosen from the file
 * extension of the URL. Returns null when the extension is not a known 3D
 * model format.
 */
export const getCadModelObjFromUrl = (
  modelUrl: string,
): CadModelUrlObj | null => {
  const ext = getFileExtension(modelUrl)
  const url = modelUrl.replace(/#ext=\w+$/, "")
  switch (ext) {
    case "stl":
      return { stlUrl: url }
    case "obj":
      return { objUrl: url }
    case "gltf":
      return { gltfUrl: url }
    case "glb":
      return { glbUrl: url }
    case "step":
    case "stp":
      return { stepUrl: url }
    case "wrl":
    case "vrml":
      return { wrlUrl: url }
    default:
      return null
  }
}
