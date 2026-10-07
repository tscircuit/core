export const resolveTextTemplate = ({
  text,
  referenceDesignator,
}: {
  text: string
  referenceDesignator?: string
}): string => {
  if (!referenceDesignator) return text

  return text
    .replace(/\{NAME\}/g, referenceDesignator)
    .replace(/\{REF\}/g, referenceDesignator)
    .replace(/\{REFERENCE\}/g, referenceDesignator)
}
