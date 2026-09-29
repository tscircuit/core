import { getFileExtension } from "../base-components/NormalComponent/utils/getFileExtension"

/** Resolve the same URL extensions and #ext hint supported by <cadmodel>. */
export const resolveAssemblyModelUrl = (modelUrl: string) => {
  const url = modelUrl.replace(/#ext=\w+$/, "")
  switch (getFileExtension(modelUrl)) {
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
      return { stlUrl: url }
  }
}
