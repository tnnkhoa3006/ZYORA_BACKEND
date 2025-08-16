import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenExpiredError } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any) {
        // Debug logs
        console.log('JWT Guard - HandleRequest');
        console.log('Error:', err);
        console.log('User:', user);
        console.log('Info:', info);

        if (info instanceof TokenExpiredError) {
            throw new UnauthorizedException('Token has expired');
        }

        if (err || !user) {
            throw new UnauthorizedException(
                `Invalid token or unauthorized: ${err?.message || info?.message || 'Unknown error'}`
            );
        }

        return user;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            
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