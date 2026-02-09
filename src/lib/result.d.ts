export type Result<T, E = Error> = Success<T> | Failure<E>;
export interface Success<T> {
    success: true;
    data: T;
}
export interface Failure<E> {
    success: false;
    error: E;
}
export declare function success<T>(data: T): Success<T>;
export declare function failure<E = Error>(error: E): Failure<E>;
export declare function isSuccess<T>(result: Result<T>): result is Success<T>;
export declare function isFailure<E>(result: Result<unknown, E>): result is Failure<E>;
