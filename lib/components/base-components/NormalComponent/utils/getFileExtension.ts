export const getFileExtension = (filename: string | null) => {
  if (!filename) return null

  const fragmentMatch = filename.match(/#ext=(\w+)$/)
  if (fragmentMatch) return fragmentMatch[1].toLowerCase()

  const withoutQuery = filename.split("?")[0]
  const sanitized = withoutQuery.split("#")[0]
  const lastSegment = sanitized.split("/").pop() ?? sanitized

  if (!lastSegment.includes(".")) return null

  const extension = lastSegment.split(".").pop()

  return extension?.toLowerCase() ?? null
}
