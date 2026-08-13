/** Why a call was refused. Every one of these is a caller mistake, named. */
export type UnitErrorCode =
  | 'UNKNOWN_LEVEL'
  | 'MALFORMED'
  | 'EMPTY_CHAIN'
  | 'NOT_GRADED'
  /** Two levels with the same name — see `chain`. */
  | 'DUPLICATE_LEVEL'
  /** A number that is not finite — see `localise`. */
  | 'NOT_FINITE'
  /** A row nobody registered — see `Register.fold`. */
  | 'UNKNOWN_ROW';

/**
 * A refusal with a reason.
 *
 * The detail rides in one typed bag rather than being spread onto the error
 * object. The JavaScript version did `Object.assign(this, detail)`, which
 * gave every error an untypeable shape and let a typo in a key pass
 * unnoticed.
 */
export class UnitError extends Error {
  readonly code: UnitErrorCode;
  readonly detail: Readonly<Record<string, unknown>>;

  constructor(code: UnitErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'UnitError';
    this.code = code;
    this.detail = Object.freeze({ ...detail });
    Object.setPrototypeOf(this, UnitError.prototype);
  }
}
