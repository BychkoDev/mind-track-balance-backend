import { IsHexadecimal, IsIn, IsString, Length, MinLength, MaxLength } from 'class-validator';
import { ClientKind } from '../client-kind.enum';

export class LoginByGoogleDto {
  @IsString()
  @MinLength(100)
  @MaxLength(4096)
  googleToken: string;

  @IsString({ message: 'Password must be a string' })
  @IsHexadecimal({ message: 'Device ID must be hexadecimal' })
  @Length(32, 32, {
    message: 'Device Fingerprinting must be between 32 characters',
  })
  readonly deviceId: string;

  @IsIn([ClientKind.WebApp, ClientKind.AndroidApp, ClientKind.IosApp], {
    message: 'Client must be either "web-app", "android-app" or "ios-app"',
  })
  readonly clientKind!: ClientKind;
}
