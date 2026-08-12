import { HttpException } from '@nestjs/common';

export function httpErrorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'string') return response;
    const message = (response as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join('; ');
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}
