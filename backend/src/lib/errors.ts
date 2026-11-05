export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details: unknown = [],
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function notFound(resource = 'Recurso'): AppError {
  return new AppError(404, 'NOT_FOUND', `${resource} no encontrado`)
}
