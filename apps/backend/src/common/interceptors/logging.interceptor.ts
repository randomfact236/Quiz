import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const requestId = uuidv4();
    const now = Date.now();

    request.requestId = requestId;

    this.logger.log({
      requestId,
      method,
      url,
      body: process.env.NODE_ENV !== 'production' ? body : undefined,
      message: 'Incoming request',
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          this.logger.log({
            requestId,
            method,
            url,
            statusCode,
            duration: `${Date.now() - now}ms`,
            message: 'Request completed',
          });
        },
        error: (error) => {
          this.logger.error({
            requestId,
            method,
            url,
            duration: `${Date.now() - now}ms`,
            error: error.message,
            message: 'Request failed',
          });
        },
      }),
    );
  }
}