import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
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
      const result = (await super.canActivate(context)) as boolean;

      if (!result) {
        throw new UnauthorizedException('Authentication failed');
      }

      return result;
    } catch (error) {
      // Only log errors, not debug info
      console.error('JWT Guard error:', error);
      throw error;
    }
  }
}
