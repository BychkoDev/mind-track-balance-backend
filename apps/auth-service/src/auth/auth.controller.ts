import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginByGoogleDto } from './dto/login-by-google.dto';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signup(@Body() signupDto: SignupDto) {
    try {
      await this.authService.signup(signupDto);
    } catch {
      throw new InternalServerErrorException('Internal error during signup');
    }
  }

  @Post('/google')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async googleSignIn(@Body() loginByGoogleDto: LoginByGoogleDto) {
    return await this.authService.loginByGoogle(loginByGoogleDto);
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshTokens(refreshToken);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: { user: { sub: string } }) {
    const userUuid = req.user.sub;
    await this.authService.logout(userUuid);
  }
}
