import { IsEmail, IsString, Length } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Email address required' })
  @Length(6, 72, { message: 'Email must be between 8 and 72 characters' })
  readonly email: string;

  @IsString({ message: 'Password must be a string' })
  @Length(8, 72, { message: 'Password must be between 8 and 72 characters' })
  readonly password: string;

  @IsString({ message: 'Full name must be a string' })
  @Length(2, 64, { message: 'Full name must be between 2 and 64 characters' })
  readonly fullName: string;

  constructor(email: string, password: string, fullName: string) {
    this.email = email;
    this.password = password;
    this.fullName = fullName;
  }

  toString() {
    return `SignupDto(email=${this.email}, fullName=${this.fullName})`;
  }
}
