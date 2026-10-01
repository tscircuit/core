import {
  PNG_MIMETYPE,
  SVG_MIMETYPE,
  loadImageSource,
} from "@tscircuit/image-utils"
import * as Effect from "effect/Effect"
import {
  CircuitEnvironment,
  CoreJobScope,
  type CoreJobContext,
} from "./core-services"
import { CoreError, corePromise, coreSync } from "./core-error"

const releaseUnusedResponse = (response: Response) =>
  corePromise(async () => {
    if (response.body && !response.bodyUsed && !response.body.locked) {
      await response.body.cancel()
    }
  }, "release_response_body").pipe(Effect.orDie)

/**
 * Own the reader, including when a custom platform response ignores fetch abort.
 * Stream-reader cleanup runs in the scope's uninterruptible finalizer. A stream
 * already at EOF/errored only needs its lock released; an interrupted read is
 * canceled. Genuine cleanup failures remain defects, rather than being hidden.
 */
function readResponseText(response: Response, job: CoreJobContext) {
  let finished = false
  let failed = false
  return Effect.acquireUseRelease(
    coreSync(() => response.body?.getReader(), "acquire_response_reader"),
    (reader) =>
      Effect.gen(function* () {
        if (!reader) return ""
        const decoder = new TextDecoder()
        let text = ""
        while (true) {
          const chunk = yield* corePromise(
            () => reader.read(),
            "read_response_body",
          ).pipe(
            Effect.catch((error) => {
              failed = true
              return Effect.fail(error)
            }),
          )
          if (chunk.done) {
            finished = true
            return text + decoder.decode()
          }
          text += decoder.decode(chunk.value, { stream: true })
        }
      }),
    (reader) =>
      corePromise(async () => {
        if (!reader) return
        try {
          if (!finished && !failed) {
            try {
              await reader.cancel()
            } catch (cause) {
              // Native fetch can error the body between interruption and cancel.
              if (
                !(
                  job.signal.aborted &&
                  cause instanceof Error &&
                  cause.name === "AbortError"
                )
              )
                throw cause
            }
          }
        } finally {
          reader.releaseLock()
        }
      }, "release_response_reader").pipe(Effect.orDie),
  )
}

function acquireResponse(request: { url: string; options?: RequestInit }) {
  return Effect.gen(function* () {
    const environment = yield* CircuitEnvironment
    const job = yield* CoreJobScope
    return yield* corePromise(async (signal) => {
      const response = await environment.fetch(request.url, {
        ...request.options,
        signal: AbortSignal.any([
          signal,
          job.signal,
          ...(request.options?.signal ? [request.options.signal] : []),
        ]),
      })
      if (
        signal.aborted ||
        job.signal.aborted ||
        request.options?.signal?.aborted
      ) {
        // An uncooperative acquisition can return after its fiber is gone.
        // It still closes the late body, without starting decoding.
        if (response.body && !response.bodyUsed && !response.body.locked)
          await response.body.cancel()
        throw (
          signal.reason ?? job.signal.reason ?? request.options?.signal?.reason
        )
      }
      return response
    }, "fetch_loading_resource")
  })
}

/** Fetch/body/reader lifetimes belong to the component's Effect job scope. */
export function loadCircuitJsonFootprint(url: string, options?: RequestInit) {
  return Effect.gen(function* () {
    const job = yield* CoreJobScope
    return yield* Effect.acquireUseRelease(
      Effect.interruptible(acquireResponse({ url, options })),
      (response) =>
        Effect.gen(function* () {
          yield* coreSync(() => {
            if (!response.ok)
              throw new Error(`Failed to fetch footprint: ${response.status}`)
          }, "validate_footprint_response")
          const text = yield* readResponseText(response, job)
          return yield* coreSync(
            () => JSON.parse(text),
            "decode_footprint_json",
          )
        }),
      releaseUnusedResponse,
    )
  })
}

/** Preserve image-utils' records/errors; inline decoding remains its adapter. */
export function loadImageSourceEffect(imageUrl: string, options?: RequestInit) {
  return Effect.gen(function* () {
    if (imageUrl.startsWith("data:")) {
      return yield* corePromise(() => loadImageSource(imageUrl), "decode_image")
    }
    const job = yield* CoreJobScope
    const acquireImage = acquireResponse({ url: imageUrl, options }).pipe(
      Effect.mapError((failure) => {
        const cause = new Error(
          `Failed to fetch image "${imageUrl}". Pass a data URL or a fetchable URL.`,
          { cause: failure.cause },
        )
        return new CoreError(cause, "load_image")
      }),
    )
    return yield* Effect.acquireUseRelease(
      Effect.interruptible(acquireImage),
      (response) =>
        Effect.gen(function* () {
          yield* coreSync(() => {
            if (!response.ok)
              throw new Error(
                `Failed to fetch image "${imageUrl}": ${response.status} ${response.statusText}`,
              )
          }, "validate_image_response")
          const responseMimetype = response.headers
            .get("content-type")
            ?.split(";")[0]
          const lowerPath = imageUrl.toLowerCase()
          const pathMimetype = lowerPath.endsWith(".svg")
            ? SVG_MIMETYPE
            : lowerPath.endsWith(".png")
              ? PNG_MIMETYPE
              : "application/octet-stream"
          const mimetype =
            responseMimetype && responseMimetype !== "application/octet-stream"
              ? responseMimetype
              : pathMimetype
          const text =
            mimetype === SVG_MIMETYPE
              ? yield* readResponseText(response, job)
              : ""
          return {
            mimetype,
            text,
            dataUrl: imageUrl,
            projectRelativePath: imageUrl,
          }
        }),
      releaseUnusedResponse,
    )
  })
}
