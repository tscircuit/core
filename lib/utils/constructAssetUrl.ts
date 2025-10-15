const joinUrlPath = (base: string, path: string): string => {
  const trimmedBase = base.replace(/\/+$/, "")
  const trimmedPath = path.replace(/^\/+/, "")
  return `${trimmedBase}/${trimmedPath}`
}

export const constructAssetUrl = (targetUrl: string, baseUrl?: string) => {
  if (!baseUrl) {
    return targetUrl
  }

  if (!targetUrl.startsWith("/")) {
    return targetUrl
  }

  try {
    const baseUrlObj = new URL(baseUrl)

    // If the targetUrl already starts with the base URL path, treat it as absolute from domain root
    // Example: targetUrl="/api/files/static/asset.kicad_mod", baseUrl="http://localhost:3020/api/files/static"
    // Result: "http://localhost:3020/api/files/static/asset.kicad_mod"
    if (
      baseUrlObj.pathname !== "/" &&
      targetUrl.startsWith(baseUrlObj.pathname)
    ) {
      return new URL(targetUrl, baseUrlObj.origin).toString()
    }

    // Otherwise, append to the base URL path
    // Example: targetUrl="/asset.glb", baseUrl="http://localhost:3020/api/files/static"
    // Result: "http://localhost:3020/api/files/static/asset.glb"
    return joinUrlPath(baseUrl, targetUrl)
  } catch (error) {
    return targetUrl
  }
}
