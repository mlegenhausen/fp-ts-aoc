import { NumberFromString } from 'io-ts-types/lib/NumberFromString'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'
import * as t from 'io-ts'
import { flow } from 'fp-ts/lib/function'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import { readFile, program, AppError } from './util'

const Input = t.array(NumberFromString)

function restore(input: number[], a: number, b: number) {
  return [input[0], a, b, ...input.slice(3)]
}

function calc(input: number[], index = 0): number[] {
  const next = index + 4
  const [cmd, a, b, pos] = input.slice(index, next)
  switch (cmd) {
    case 1:
      return calc(A.unsafeUpdateAt(pos, input[a] + input[b], input), next)
    case 2:
      return calc(A.unsafeUpdateAt(pos, input[a] * input[b], input), next)
    case 99:
      return input
    default:
      throw new Error('Invalid cmd')
  }
}

const tuple = (a: number) => (b: number): [number, number] => [a, b]

function tryOut(input: number[]): O.Option<[number, number]> {
  const r = A.range(0, 99)
  return pipe(
    A.of(tuple),
    A.ap(r),
    A.ap(r),
    A.findFirst(([a, b]) =>
      pipe(
        restore(input, a, b),
        calc,
        A.head,
        O.filter(a => a === 19690720),
        O.fold(
          () => false,
          () => true
        )
      )
    )
  )
}

const main: TE.TaskEither<never, never> = program(
  pipe(
    readFile('inputs/2'),
    TE.bimap(AppError.FSError, input => input.trim().split(',')),
    TE.chain(values =>
      pipe(
        Input.decode(values),
        TE.fromEither,
        TE.mapLeft(errors => AppError.ValidationErrors(errors, values))
      )
    ),
    TE.map(
      flow(
        tryOut,
        O.fold(
          () => 'No answer found',
          ([a, b]) => `${String(a).padStart(2, '0')}${String(b).padStart(2, '0')}`
        )
      )
    )
  )
)

main()
