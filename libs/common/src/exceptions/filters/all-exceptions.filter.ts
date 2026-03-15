import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    // Формуємо формат помилки, що буде повернений клієнту
    response.status(status).json({
      statusCode: status,
      message:
        typeof errorResponse === 'string'
          ? errorResponse
          : errorResponse['message'],
      error: exception.constructor.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
