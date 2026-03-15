import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidCredentialsException extends HttpException {
  constructor(errorMessage: string) {
    super(errorMessage, HttpStatus.UNAUTHORIZED);
  }
}
