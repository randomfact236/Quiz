import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Type for error details - can be a record of unknown values or an array of unknown values
 */
type ErrorDetails = Record<string, unknown> | unknown[];

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  requestId: string;
  path: string;
  method: string;
  message: string;
  error: string;
  details?: ErrorDetails;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details = undefined;
    let stack = undefined;

    if (exception instanceof HttpException) {
      const httpException = exception as HttpException;
      status = httpException.getStatus();
      const exceptionResponse = httpException.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = typeof responseObj.message === 'string' ? responseObj.message : message;
        error = typeof responseObj.error === 'string' ? responseObj.error : error;
        details = responseObj.details as ErrorDetails | undefined;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      stack = exception.stack;
    }

    // Log the error
    this.logger.error({
      requestId,
      method: request.method,
      path: request.url,
      statusCode: status,
      message,
      error,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      requestId,
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Include details in development
    if (process.env.NODE_ENV !== 'production') {
      if (details) errorResponse.details = details;
      if (stack) errorResponse.stack = stack;
    }

    response.status(status).json(errorResponse);
  }
}