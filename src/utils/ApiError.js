class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",  // Fixed typo in "Something"
        errors = [],
        stack = ""    // Fixed typo in parameter name
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack    // Fixed typo in variable name
        } else {
            Error.captureStackTrace(this, this.constructor)  // Fixed typo in "constructor"
        }
    }
}

export { ApiError }