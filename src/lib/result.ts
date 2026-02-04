export type Result<T, E = Error> = Success<T> | Failure<E>

export interface Success<T> {
  success: true
  data: T
}

export interface Failure<E> {
  success: false
  error: E
}

export function success<T>(data: T): Success<T> {
  return { success: true, data }
}

export function failure<E = Error>(error: E): Failure<E> {
  return { success: false, error }
}

// Helper type guard to check if a result is a success
export function isSuccess<T>(result: Result<T>): result is Success<T> {
  return result.success === true
}

// Helper type guard to check if a result is a failure
export function isFailure<E>(result: Result<unknown, E>): result is Failure<E> {
  return result.success === false
}
