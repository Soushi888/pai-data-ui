import { json } from '@sveltejs/kit'
import type { DataError } from '$lib/data/errors.js'

export function errorResponse(err: DataError): Response {
  if (err._tag === 'FileNotFoundError') {
    return json(
      { type: '/errors/not-found', title: 'Not Found', status: 404, detail: `Entity '${err.id}' does not exist` },
      { status: 404 }
    )
  }
  if (err._tag === 'ValidationError') {
    return json(
      { type: '/errors/validation-error', title: 'Validation Error', status: 400, detail: `${err.field}: ${err.message}` },
      { status: 400 }
    )
  }
  return json(
    { type: '/errors/server-error', title: 'Server Error', status: 500, detail: String(err) },
    { status: 500 }
  )
}
