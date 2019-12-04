import { NumberFromString } from 'io-ts-types/lib/NumberFromString'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import { readFile, program, AppError } from './util'

const Input = t.tuple([NumberFromString, NumberFromString])

function is(n: number): boolean {
  const v = String(n).split('')
  return v.every((v, i, a) => (i > 0 ? v >= a[i - 1] : true)) && v.some((v, i, a) => (i > 0 ? v === a[i - 1] : false))
}

function test([from, to]: [number, number]): number {
  return pipe(
    A.range(from, to),
    A.reduce(0, (sum, n) => (is(n) ? sum + 1 : sum))
  )
}

const main: TE.TaskEither<never, never> = program(
  pipe(
    readFile('inputs/4'),
    TE.bimap(AppError.FSError, input => input.trim().split('-')),
    TE.chain(values =>
      pipe(
        Input.decode(values),
        TE.fromEither,
        TE.mapLeft(errors => AppError.ValidationErrors(errors, values))
      )
    ),
    TE.map(test)
  )
)

main()
