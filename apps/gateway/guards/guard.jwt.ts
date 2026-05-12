import {
    Injectable,
    ExecutionContext,
    CanActivate,
    UnauthorizedException,
    Inject
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
    
}
