export const getEmbeddedSchematicGraphicSvgContent = (
  schematicSvg: string,
): string => {
  const href = schematicSvg.match(/<image\b[^>]*\bhref="([^"]+)"/)?.[1]
  if (!href) throw new Error("Expected an embedded schematic graphic image")

  const dataUrlMatch = href.match(/^data:image\/svg\+xml([^,]*),(.*)$/is)
  if (!dataUrlMatch) {
    throw new Error("Expected the schematic graphic image to contain SVG data")
  }

  const [, metadata = "", payload = ""] = dataUrlMatch
  if (metadata.toLowerCase().split(";").includes("base64")) {
    return Buffer.from(payload, "base64").toString("utf8")
  }

  return decodeURIComponent(payload)
}
