import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

// Centralized error handler — returns a consistent JSON shape.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500
  let message = err.message || 'Server error'

  if (err.name === 'ValidationError') {
    status = 400
    message = Object.values(err.errors)[0]?.message || 'Validation error'
  } else if (err.name === 'CastError') {
    status = 400
    message = `Invalid ${err.path}: ${err.value}`
  } else if (err.code === 11000) {
    status = 409
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`
  }

  if (status === 500) console.error(err)

  res.status(status).json({
    success: false,
    message,
    ...(env.nodeEnv === 'development' && status === 500 ? { stack: err.stack } : {}),
  })
}
