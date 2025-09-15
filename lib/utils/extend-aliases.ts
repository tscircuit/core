export const extendAliases = (
  aliases: string[],
  additionalAliases: Record<string, string[]>,
): string[] => {
  return Array.from(
    new Set(
      aliases.flatMap((alias) => {
        return [alias, ...(additionalAliases[alias] || [])]
      }),
    ),
  )
}
