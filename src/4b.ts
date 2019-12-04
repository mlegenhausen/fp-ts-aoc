import { NumberFromString } from 'io-ts-types/lib/NumberFromString'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import { Eq } from 'fp-ts/lib/Eq'
import { ordString } from 'fp-ts/lib/Ord'
import { readFile, program, AppError } from './util'

const Input = t.tuple([NumberFromString, NumberFromString])

function split(n: number) {
  return String(n).split('')
}

function group<A>(S: Eq<A>): (as: Array<A>) => Array<Array<A>> {
  return A.chop(as => {
    const { init, rest } = A.spanLeft((a: A) => S.equals(a, as[0]))(as)
    return [init, rest]
  })
}

function increase(n: number) {
  return split(n).every((v, i, a) => (i > 0 ? v >= a[i - 1] : true))
}

function adjacents(n: number) {
  return pipe(n, split, group(ordString)).some(v => v.length === 2)
}

function is(n: number): boolean {
  return increase(n) && adjacents(n)
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
