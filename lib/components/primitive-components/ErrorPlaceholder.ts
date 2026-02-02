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

      this.root.db.source_failed_to_create_component_error.insert({
        component_name: this._parsedProps.component_name,
        error_type: "source_failed_to_create_component_error",
        message: `Could not create ${this._parsedProps.componentType ?? "component"}${this._parsedProps.name ? ` "${this._parsedProps.name}"` : ""}. ${
          this._parsedProps.error?.formattedError?._errors?.join("; ") ||
          this._parsedProps.message
        }`,

        pcb_center: pcbPosition,
        schematic_center: schematicPosition,
        is_fatal: true,
      })
    }
  }
}

export function createErrorPlaceholderComponent(props: any, error: any) {
  return new ErrorPlaceholderComponent(props, error)
}
