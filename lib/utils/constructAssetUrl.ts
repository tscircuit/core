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
    if (
      baseUrlObj.pathname !== "/" &&
      targetUrl.startsWith(baseUrlObj.pathname)
    ) {
      const resolved = new URL(targetUrl, baseUrlObj.origin)
      return resolved.toString()
    }

    // Otherwise, append to the base URL path
    const baseUrlWithTrailingSlash = baseUrl.endsWith("/")
      ? baseUrl
      : baseUrl + "/"
    const resolved = new URL(targetUrl.substring(1), baseUrlWithTrailingSlash)
    return resolved.toString()
  } catch (error) {
    return targetUrl
  }
}
