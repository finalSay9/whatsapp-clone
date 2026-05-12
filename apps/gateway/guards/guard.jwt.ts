import {
    Injectable,
    ExecutionContext,
    CanActivate,
    UnauthorizedException,
    Inject
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(@Inject('AUTH_SERVICE') private readonly authClient: ClientProxy){}
    canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>()
        
        //extract token from the authorization header
        const token = this.extractToken(request)
        //if token not provided
        if(!token) {
            throw new UnauthorizedException('No Token Provide')
        }
    }


}
