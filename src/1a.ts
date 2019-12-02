import { NumberFromString } from 'io-ts-types/lib/NumberFromString'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import { monoidSum, fold } from 'fp-ts/lib/Monoid'
import * as A from 'fp-ts/lib/Array'
import { flow } from 'fp-ts/lib/function'
import { readFile, program, AppError } from './util'

const Input = t.array(NumberFromString)

function calc(input: number): number {
  return Math.floor(input / 3) - 2
}

const main: TE.TaskEither<never, never> = program(
  pipe(
    readFile('inputs/1'),
    TE.bimap(AppError.FSError, input => input.trim().split('\n')),
    TE.chain(values =>
      pipe(
        Input.decode(values),
        TE.fromEither,
        TE.mapLeft(errors => AppError.ValidationErrors(errors, values))
      )
    ),
    TE.map(flow(A.map(calc), fold(monoidSum)))
  )
)

main()
