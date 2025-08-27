export class LoginResponseDto {
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    message: string;
}

export class RegisterResponseDto {
    success: boolean;
    message: string;
    user: {
        _id: string;
        username: string;
        email: string;
        role: string;
        avatarUrl?: string;
        createdAt: Date;
        updatedAt: Date;
    };
}

export class RefreshTokenResponseDto {
    success: boolean;
    accessToken: string;
    expiresIn: number;
    message: string;
}

export class LogoutResponseDto {
    message: string;
}
