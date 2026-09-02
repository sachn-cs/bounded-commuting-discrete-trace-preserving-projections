/**
 * Thrown when mesh input data fails validation.
 */
export class ValidateError extends Error {
  /**
   * @param message - Error message.
   * @param index - The offending element index, if applicable.
   */
  constructor(message: string, index?: number);
  name: 'ValidateError';
  /** The offending element index, if applicable. */
  index?: number;
}

/**
 * Thrown when a projection cannot be computed.
 */
export class ProjectError extends Error {
  constructor(message: string);
  name: 'ProjectError';
}

/**
 * Thrown when a linear system is singular or numerically ill-conditioned.
 */
export class SingularError extends Error {
  constructor(message: string);
  name: 'SingularError';
}
