import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface AuthenticatedUser {
  userId: string;
  username: string;
  roles: string[];
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err: Error | null,
    user: any,
    info: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    status?: any,
  ): any {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('Token has expired');
    }

    if (err || !user) {
      let errorMessage = 'Unknown error';

      if (err?.message) {
        errorMessage = err.message;
      }

      throw new UnauthorizedException(
        `Invalid token or unauthorized: ${errorMessage}`,
      );
    }

    return user;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

      // Debug logs
      console.log('JWT Guard - CanActivate');
      console.log('Headers:', request.headers);
      console.log('Auth header:', request.headers.authorization);

      const result = (await super.canActivate(context)) as boolean;

      if (!result) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Log authenticated user
      console.log('Authenticated user:', request.user);

      return result;
    } catch (error) {
      console.error('JWT Guard error:', error);
      throw error;
    }
  }
}
