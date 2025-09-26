export const getFileExtension = (filename: string | null) => {
  if (!filename) return null
  const cleanFilename = filename.split("?")[0]
  return cleanFilename.split(".").pop()
}
