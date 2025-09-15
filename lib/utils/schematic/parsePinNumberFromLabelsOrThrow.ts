export const parsePinNumberFromLabelsOrThrow = (
  pinNumberOrLabel: string | number,
  pinLabels?: Record<string, string[] | string> | null,
): number => {
  if (typeof pinNumberOrLabel === "number") {
    return pinNumberOrLabel;
  }

  if (pinNumberOrLabel.startsWith("pin")) {
    const pinNumber = Number(pinNumberOrLabel.slice(3));
    return pinNumber;
  }

  if (!pinLabels) {
    throw new Error(
      `No pin labels provided and pin number or label is not a number: "${pinNumberOrLabel}"`,
    );
  }

  for (const pinNumberKey in pinLabels) {
    const aliases = Array.isArray(pinLabels[pinNumberKey])
      ? pinLabels[pinNumberKey]
      : [pinLabels[pinNumberKey]];

    if (aliases.includes(pinNumberOrLabel)) {
      return Number(pinNumberKey.replace("pin", ""));
    }
  }

  throw new Error(
    `No pin labels provided and pin number or label is not a number: "${pinNumberOrLabel}"`,
  );
};
