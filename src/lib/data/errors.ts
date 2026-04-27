import { Data } from "effect";

/** Raised when a requested entity file does not exist on disk. */
export class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
  /** ID of the entity that was not found. */
  id: string;
}> {}

/** Raised when a markdown file cannot be parsed (malformed YAML frontmatter or I/O error). */
export class ParseError extends Data.TaggedError("ParseError")<{
  /** Path to the file that failed to parse. */
  file: string;
  /** Underlying error from the filesystem or YAML parser. */
  cause: unknown;
}> {}

/** Raised when entity data fails validation rules. */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  /** Name of the field that failed validation. */
  field: string;
  /** Human-readable validation failure message. */
  message: string;
}> {}

/** Raised when writing to a file fails (permissions, disk space, etc.). */
export class WriteError extends Data.TaggedError("WriteError")<{
  /** Path to the file that could not be written. */
  file: string;
  /** Underlying I/O error. */
  cause: unknown;
}> {}

/** Union of all possible data layer errors. Used as the error channel in Effect return types. */
export type DataError =
  | FileNotFoundError
  | ParseError
  | ValidationError
  | WriteError;
