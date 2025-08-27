import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
    constructor(
        @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private usersService: UsersService,
    ) {}

    async createRefreshToken(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        const refreshToken = new this.refreshTokenModel({
            userId: new Types.ObjectId(userId),
            token,
            expiresAt,
            ipAddress,
            userAgent,
        });

        await refreshToken.save();
        return token;
    }

    async validateRefreshToken(token: string): Promise<RefreshTokenDocument | null> {
        const refreshToken = await this.refreshTokenModel.findOne({
            token,
            isRevoked: false,
            expiresAt: { $gt: new Date() },
        }).exec();

        return refreshToken;
    }

    async revokeRefreshToken(token: string): Promise<void> {
        await this.refreshTokenModel.updateOne(
            { token },
            { isRevoked: true }
        ).exec();
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await this.refreshTokenModel.updateMany(
            { userId: new Types.ObjectId(userId) },
            { isRevoked: true }
        ).exec();
    }

    async generateTokenPair(userId: string, username: string, roles: string[], ipAddress?: string, userAgent?: string) {
        const payload = { sub: userId, username, roles };
        
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m', // 15 minutes
        });

        const refreshToken = await this.createRefreshToken(userId, ipAddress, userAgent);

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
        };
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
        const tokenDoc = await this.validateRefreshToken(refreshToken);
        
        if (!tokenDoc) {
            return null;
        }

        // Get user info from the refresh token's user
        const user = await this.usersService.findById(tokenDoc.userId.toString());
        if (!user) {
            return null;
        }

        const payload = { 
            sub: (user as any)._id?.toString() || '', 
            username: user.username,
            roles: [user.role]
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m',
        });

        return {
            accessToken,
            expiresIn: 15 * 60,
        };
    }
}
