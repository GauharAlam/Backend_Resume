/**
 * Standardized API Response wrapper
 */
class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }

    static success(data, message = 'Success') {
        return new ApiResponse(200, data, message);
    }

    static created(data, message = 'Created successfully') {
        return new ApiResponse(201, data, message);
    }

    static noContent(message = 'Deleted successfully') {
        return new ApiResponse(204, null, message);
    }

    static error(message = 'Error', statusCode = 400, errors = []) {
        return {
            success: false,
            statusCode,
            message,
            errors,
        };
    }
}

module.exports = ApiResponse;
