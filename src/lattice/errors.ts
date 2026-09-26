export type UnitErrorCode =
  | 'UNKNOWN_LEVEL'
  | 'MALFORMED'
  | 'EMPTY_CHAIN'
  | 'DUPLICATE_LEVEL'
  | 'NOT_FINITE'
  | 'UNKNOWN_ROW'
  | 'rest-cycle'
  | 'widening-travels'
  | 'withdrawal-unnamed'
  | 'sign-mismatch'
  | 'join-unwitnessed'
  | 'attention-spent';

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
