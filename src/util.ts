import fs from 'fs'
import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import * as IO from 'fp-ts/lib/IO'
import { pipe } from 'fp-ts/lib/pipeable'
import { Union, of } from 'ts-union'
import { failure } from 'io-ts/lib/PathReporter'
import * as console from 'fp-ts/lib/Console'
import * as t from 'io-ts'

export function readFile(filename: string): TE.TaskEither<Error, string> {
  return TE.tryCatch(() => fs.promises.readFile(filename, 'utf8'), E.toError)
}

export function exit(code: number): IO.IO<never> {
  return () => process.exit(code)
}

export const AppError = Union({
  FSError: of<Error>(),
  ValidationErrors: of<t.Errors, unknown>()
})
type AppError = typeof AppError.T

export function formatError(error: AppError): string {
  return AppError.match(error, {
    FSError: error => error.message,
    ValidationErrors: (errors, input) => failure(errors).join('\n')
  })
}

export function program(te: TE.TaskEither<AppError, unknown>): TE.TaskEither<never, never> {
  return pipe(
    te,
    TE.chain(output =>
      TE.rightIO(
        pipe(
          console.log(output),
          IO.chain(() => exit(0))
        )
      )
    ),
    TE.orElse(error =>
      TE.rightIO(
        pipe(
          console.error(formatError(error)),
          IO.chain(() => exit(1))
        )
      )
    )
  )
}

export function spy<A>(a: A): A {
  console.log(a)()
  return a
}
