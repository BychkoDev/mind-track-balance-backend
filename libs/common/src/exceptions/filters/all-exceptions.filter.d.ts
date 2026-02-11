import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
export declare class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void;
}
