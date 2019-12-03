import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import * as A from 'fp-ts/lib/Array'
import * as R from 'fp-ts/lib/Record'
import { flow, not } from 'fp-ts/lib/function'
import * as T from 'fp-ts/lib/Tuple'
import { readFile, program, AppError } from './util'

interface Field extends Record<string, Record<string, Set<number>>> {}

const Input = t.array(t.array(t.string))

function insert(x: number, y: number, wire: number, xs: Field): Field {
  if (typeof xs[x] !== 'undefined') {
    if (typeof xs[x][y] !== 'undefined') {
      xs[x][y].add(wire)
    } else {
      xs[x][y] = new Set([wire])
    }
  } else {
    xs[x] = { [y]: new Set([wire]) }
  }
  return xs
}

function wireup(wire: number, field: Field, steps: string[]): Field {
  return pipe(
    steps,
    A.map(step => /^([RDUL])([0-9]+)$/.exec(step)?.slice(1) as [string, string]),
    A.reduce<[string, string], [Field, [number, number]]>([field, [0, 0]], ([field, [x, y]], [d, num]) => {
      const n = Number(num)
      const moves = A.range(1, n)
      switch (d) {
        case 'R':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x + i, y, wire, field))
            ),
            [x + n, y]
          ]
        case 'L':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x - i, y, wire, field))
            ),
            [x - n, y]
          ]
        case 'U':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x, y + i, wire, field))
            ),
            [x, y + n]
          ]
        case 'D':
          return [
            pipe(
              moves,
              A.reduce(field, (field, i) => insert(x, y - i, wire, field))
            ),
            [x, y - n]
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
    R.reduceWithIndex(Infinity, (x, prev, ys) =>
      Math.min(
        pipe(
          ys,
          R.reduceWithIndex(Infinity, (y, prev) => Math.min(Math.abs(Number(x)) + Math.abs(Number(y)), prev))
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
        R.map(R.filter(wires => wires.size >= 2)),
        R.filter((field): field is Record<string, Set<number>> => pipe(field, not(R.isEmpty))),
        distance
      )
    )
  )
)

main()
