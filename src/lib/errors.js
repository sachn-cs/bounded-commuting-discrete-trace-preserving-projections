/**
 * Structured error types for the Projector library.
 */

/**
 * Thrown when mesh input data fails validation.
 */
export class ValidateError extends Error {
  /**
   * @param {string} message
   * @param {number=} index - The offending element index, if applicable.
   */
  constructor (message, index) {
    super(message)
    this.name = 'ValidateError'
    this.index = index
  }
}

/**
 * Thrown when a projection cannot be computed.
 */
export class ProjectError extends Error {
  /**
   * @param {string} message - Description of the projection failure.
   */
  constructor (message) {
    super(message)
    this.name = 'ProjectError'
  }
}

/**
 * Thrown when a linear system is singular or numerically ill-conditioned.
 */
export class SingularError extends Error {
  /**
   * @param {string} message - Description of the singularity condition.
   */
  constructor (message) {
    super(message)
    this.name = 'SingularError'
  }
}
