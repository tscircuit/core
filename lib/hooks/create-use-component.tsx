import React, { Component, type ComponentProps } from "react"
import { z } from "zod"
import { resistorProps, resistorPins } from "@tscircuit/props"

export const createUseComponent = <
  C extends React.ComponentType<any>,
  PiD extends string,
>(
  Component: C,
  pins:
    | readonly PiD[]
    | readonly (readonly PiD[])[]
    | { [key: string]: readonly PiD[] },
) => {
  return <T extends Omit<ComponentProps<C>, "name"> | undefined = undefined>(
    name: string,
    props?: T,
  ): React.ComponentType<
    (T extends undefined
      ? Omit<ComponentProps<C>, "name">
      : Omit<Partial<ComponentProps<C>>, "name">) & {
      [key in PiD]?: string
    }
  > & {
    [key in PiD]: string
  } => {
    const pinLabelsFlatArray: PiD[] = []
    if (Array.isArray(pins)) {
      pinLabelsFlatArray.push(...pins.flat())
    } else if (typeof pins === "object") {
      pinLabelsFlatArray.push(...Object.values(pins).flat())
      pinLabelsFlatArray.push(...(Object.keys(pins) as PiD[]))
    }
    const R: any = (props2: any) => {
      const combinedProps = { ...props, ...props2, name }
      const tracesToCreate: any[] = []

      for (const portLabel of pinLabelsFlatArray) {
        if (combinedProps[portLabel]) {
          const from = `.${name} > .${portLabel}`
          const to = combinedProps[portLabel]
          tracesToCreate.push({ from, to })
          delete combinedProps[portLabel]
        }
      }

      return (
        <>
          <Component {...combinedProps} />
          {tracesToCreate.map((trace, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <trace key={i} {...trace} />
          ))}
        </>
      )
    }
    for (const port of pinLabelsFlatArray) {
      R[port] = `.${name} > .${port}`
    }

    return R
  }
}
