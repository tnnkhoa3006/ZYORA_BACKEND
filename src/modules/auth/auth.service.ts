import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';

interface UserObject {
  _id?: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }
    return { message: `User with ID ${userId} logged out successfully` };
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPair = await this.refreshTokenService.generateTokenPair(
      user._id?.toString() || '',
      user.username,
      [user.role],
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      expiresIn: tokenPair.expiresIn,
      message: 'Login successful',
    };
  }

  async register(username: string, email: string, password: string) {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await this.userService.create({
      username,
      email,
      password: hashedPassword,
    });

    // Convert mongoose doc sang object thuần với kiểu rõ ràng
    const userObj = newUser.toObject() as UserObject;

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        _id: userObj._id || '',
        username: userObj.username,
        email: userObj.email,
        role: userObj.role,
        avatarUrl: userObj.avatarUrl,
        createdAt: userObj.createdAt || new Date(),
        updatedAt: userObj.updatedAt || new Date(),
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const result =
      await this.refreshTokenService.refreshAccessToken(refreshToken);

    if (!result) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      success: true,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      message: 'Token refreshed successfully',
    };
  }
}
