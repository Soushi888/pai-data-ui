import { Data } from 'effect'

export class FileNotFoundError extends Data.TaggedError('FileNotFoundError')<{ id: string }> {}
export class ParseError extends Data.TaggedError('ParseError')<{
  file: string
  cause: unknown
}> {}
export class ValidationError extends Data.TaggedError('ValidationError')<{
  field: string
  message: string
}> {}
export class WriteError extends Data.TaggedError('WriteError')<{
  file: string
  cause: unknown
}> {}

export type DataError = FileNotFoundError | ParseError | ValidationError | WriteError
