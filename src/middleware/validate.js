import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'

// Collects express-validator results and throws a 400 with the first message.
export const validate = (req, _res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()
  const first = errors.array()[0]
  next(ApiError.badRequest(first.msg))
}
