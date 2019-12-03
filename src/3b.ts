import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import * as R from 'fp-ts/lib/Record'
import { flow, not } from 'fp-ts/lib/function'
import * as T from 'fp-ts/lib/Tuple'
import { fold, monoidSum } from 'fp-ts/lib/Monoid'
import { readFile, program, AppError } from './util'

interface Field extends Record<string, Record<string, Record<string, number>>> {}

const Input = t.array(t.array(t.string))

function insert(x: number, y: number, w: number, i: number, xs: Field): Field {
  if (typeof xs[x] !== 'undefined') {
    const ys = xs[x]
    if (typeof ys[y] !== 'undefined') {
      const ws = ys[y]
      if (typeof ws[w] === 'undefined') {
        ws[w] = i
      }
    } else {
      ys[y] = { [w]: i }
    }
  } else {
    xs[x] = { [y]: { [w]: i } }
  }
  return xs
}

function wireup(wire: number, field: Field, steps: string[]): Field {
  return pipe(
    steps,
    A.map(step => /^([RDUL])([0-9]+)$/.exec(step)?.slice(1) as [string, string]),
    A.reduce<[string, string], [Field, [number, number, number]]>([field, [0, 0, 0]], ([field, [x, y, s]], [d, num]) => {
      const n = Number(num)
      const moves = A.range(1, n)
      switch (d) {
        case 'R':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x + i, y, wire, s + i, field))
            ),
            [x + n, y, s + n]
          ]
        case 'L':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x - i, y, wire, s + i, field))
            ),
            [x - n, y, s + n]
          ]
        case 'U':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x, y + i, wire, s + i, field))
            ),
            [x, y + n, s + n]
          ]
        case 'D':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x, y - i, wire, s + i, field))
            ),
            [x, y - n, s + n]
          ]
        default:
          throw new Error('Invalid direction ' + d)
      }
    }),
    T.fst
  )
}

function distance(xs: Field): number {
  return pipe(
    xs,
    R.reduce(Infinity, (prev, ys) =>
      Math.min(
        pipe(
          ys,
          R.reduce(Infinity, (prev, steps) => Math.min(fold(monoidSum)(Object.values(steps)), prev))
        ),
        prev
      )
    )
  )
}

const main: TE.TaskEither<never, never> = program(
  pipe(
    readFile('inputs/3'),
    TE.bimap(AppError.FSError, input =>
      pipe(
        input.trim().split('\n'),
        A.map(s => s.split(','))
      )
    ),
    TE.chain(values =>
      pipe(
        Input.decode(values),
        TE.fromEither,
        TE.mapLeft(errors => AppError.ValidationErrors(errors, values))
      )
    ),
    TE.map(
      flow(
        A.reduceWithIndex<string[], Field>({}, wireup),
        R.map(R.filter(wires => R.size(wires) >= 2)),
        R.filter((field): field is Record<string, Record<string, number>> => pipe(field, not(R.isEmpty))),
        distance
      )
    )
  )
)

main()
