import type { ZodFormattedError } from "zod";
export class InvalidProps extends Error {
  constructor(
    public readonly componentName: string,
    public readonly originalProps: any,
    public readonly formattedError: ZodFormattedError<any>,
  ) {
    let message: string;

    const propsWithError = Object.keys(formattedError).filter(
      (k) => k !== "_errors",
    );

    const invalidPinLabelMessages: string[] = [];
    const pinLabels = originalProps.pinLabels as
      | Record<string, string | string[]>
      | undefined;
    if (pinLabels) {
      for (const [pin, labelOrLabels] of Object.entries(pinLabels)) {
        const labels = Array.isArray(labelOrLabels)
          ? labelOrLabels
          : [labelOrLabels];
        for (const label of labels) {
          if (
            typeof label === "string" &&
            (label.startsWith(" ") || label.endsWith(" "))
          ) {
            invalidPinLabelMessages.push(
              `pinLabels.${pin} ("${label}" has leading or trailing spaces)`,
            );
          }
        }
      }
    }

    const propMessage = propsWithError
      .map((k) => {
        if (k === "pinLabels" && invalidPinLabelMessages.length > 0) {
          return invalidPinLabelMessages.join(", ");
        }
        if ((formattedError as any)[k]._errors[0]) {
          return `${k} (${(formattedError as any)[k]._errors[0]})`;
        }
        return `${k} (${JSON.stringify((formattedError as any)[k])})`;
      })
      .join(", ");

    if ("name" in originalProps) {
      message = `Invalid props for ${componentName} "${originalProps.name}": ${propMessage}`;
    } else if (
      "footprint" in originalProps &&
      typeof originalProps.footprint === "string"
    ) {
      message = `Invalid props for ${componentName} (unnamed ${originalProps.footprint} component): ${propMessage}`;
    } else {
      message = `Invalid props for ${componentName} (unnamed): ${propMessage}`;
    }

    super(message);
  }
}
