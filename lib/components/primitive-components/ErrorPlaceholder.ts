import { PrimitiveComponent } from "../base-components/PrimitiveComponent/PrimitiveComponent"
import { z } from "zod"

class ErrorPlaceholderComponent extends PrimitiveComponent {
  constructor(props: any, error: any) {
    super(props)
    const resolveCoordinate = (value: unknown, axis: "pcbX" | "pcbY") => {
      if (typeof value === "number") return value
      if (typeof value === "string") {
        try {
          return this._resolvePcbCoordinate(value, axis, {
            allowBoardVariables: false,
          })
        } catch (err) {
          return 0
        }
      }
      return 0
    }
    this._parsedProps = {
      ...props,
      error,
      type: props.type || "unknown",
      component_name: props.name,
      error_type: "source_failed_to_create_component_error",
      message: error instanceof Error ? error.message : String(error),
      pcbX: resolveCoordinate(props.pcbX, "pcbX"),
      pcbY: resolveCoordinate(props.pcbY, "pcbY"),
      schX: props.schX,
      schY: props.schY,
    }
  }

  private formatErrorDetails() {
    const selectorValue =
      this._parsedProps.selector ??
      this._parsedProps.selectors ??
      this._parsedProps.in ??
      this._parsedProps.within
    const selectorText =
      selectorValue === undefined
        ? undefined
        : typeof selectorValue === "string"
          ? selectorValue
          : this.safeStringify(selectorValue)
    const propsText = this.safeStringify(this._parsedProps)

    return {
      selectorText,
      propsText,
    }
  }

  private safeStringify(value: unknown) {
    const seen = new WeakSet()
    const json = JSON.stringify(
      value,
      (_key, item) => {
        if (typeof item === "bigint") {
          return item.toString()
        }
        if (typeof item === "function") {
          return `[Function ${item.name || "anonymous"}]`
        }
        if (typeof item === "symbol") {
          return item.toString()
        }
        if (typeof item === "object" && item !== null) {
          if (seen.has(item)) return "[Circular]"
          seen.add(item)
        }
        return item
      },
      2,
    )

    if (!json) {
      return "undefined"
    }

    if (json.length > 1600) {
      return `${json.slice(0, 1600)}…`
    }

    return json
  }

  get config() {
    return {
      componentName: "ErrorPlaceholder",
      zodProps: z.object({}).passthrough(),
    }
  }

  doInitialSourceRender() {
    if (this.root?.db) {
      const pcbPosition = this._getGlobalPcbPositionBeforeLayout()
      const schematicPosition = this._getGlobalSchematicPositionBeforeLayout()
      const { selectorText, propsText } = this.formatErrorDetails()
      const messageDetails = [
        selectorText ? `Within selector: ${selectorText}` : null,
        `Props: ${propsText}`,
      ]
        .filter(Boolean)
        .join(" ")
      const baseMessage = `Could not create ${this._parsedProps.componentType ?? "component"}${this._parsedProps.name ? ` "${this._parsedProps.name}"` : ""}. ${
        this._parsedProps.error?.formattedError?._errors?.join("; ") ||
        this._parsedProps.message
      }`

      this.root.db.source_failed_to_create_component_error.insert({
        component_name: this._parsedProps.component_name,
        error_type: "source_failed_to_create_component_error",
        message: `${baseMessage}${messageDetails ? ` Details: ${messageDetails}` : ""}`,

        pcb_center: pcbPosition,
        schematic_center: schematicPosition,
      })
    }
  }
}

export function createErrorPlaceholderComponent(props: any, error: any) {
  return new ErrorPlaceholderComponent(props, error)
}
