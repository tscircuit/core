export const constructAssetUrl = (targetUrl: string, baseUrl?: string) => {
  if (!baseUrl) {
    return targetUrl
  }

  if (!targetUrl.startsWith("/")) {
    return targetUrl
  }

  try {
    const base = new URL(baseUrl)
    const resolved = new URL(targetUrl, base.origin)
    return resolved.toString()
  } catch (error) {
    return targetUrl
  }
}
