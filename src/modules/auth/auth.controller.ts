import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { Request } from 'express';

type LoginRequest = Request & {
  connection: {
    remoteAddress?: string;
  };
};

interface AuthedRequest extends Request {
  user: { userId: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: LoginRequest,
    @Headers('user-agent') userAgent?: string,
  ): Promise<LoginResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    return this.authService.login(
      loginDto.email,
      loginDto.password,
      ipAddress,
      userAgent,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: AuthedRequest,
    @Body('refreshToken') refreshToken?: string,
  ): Promise<LogoutResponseDto> {
    console.log('User in request:', req.user);
    return this.authService.logout(req.user.userId, refreshToken);
  }

  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
