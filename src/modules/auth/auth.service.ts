import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    logout(userId: string) {
        return { message: `User with ID ${userId} logged out successfully` };
    }

    async login(email: string, password: string) {
        try {
            const user = await this.userService.findByEmail(email);
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const payload = { sub: user._id, username: user.username, roles: user.role };
            const token = this.jwtService.sign(payload);

            return {
                success: true,
                accessToken: token,
                message: 'Login successful',
            };
        } catch (error) {
            throw error; // để NestJS xử lý và trả lỗi đúng status code
        }
    }

    async register(username: string, email: string, password: string) {
        try {
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

            // Convert mongoose doc sang object thuần
            const userObj = newUser.toObject();

            return {
                success: true,
                message: 'User registered successfully',
                user: userObj,
            };
        } catch (error) {
            console.error('Error in register:', error.message);
            throw error;
        }
    }
}
