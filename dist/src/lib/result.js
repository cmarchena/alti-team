"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.failure = failure;
exports.isSuccess = isSuccess;
exports.isFailure = isFailure;
function success(data) {
    return { success: true, data };
}
function failure(error) {
    return { success: false, error };
}
// Helper type guard to check if a result is a success
function isSuccess(result) {
    return result.success === true;
}
// Helper type guard to check if a result is a failure
function isFailure(result) {
    return result.success === false;
}
