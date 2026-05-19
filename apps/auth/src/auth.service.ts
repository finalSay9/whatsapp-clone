import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from "@nestjs/config";
import { PrismaService } from '@app/common';
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    // 1. check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'Email Already In Use'
      });
    }

    // 2. hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. create user
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    // 4. sign token
    const token = await this.signToken(user.id, user.email);

    return {
      message: "Registration successful",
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    // 1. find user
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new RpcException({
        statusCode: 401,
        message: 'Invalid Credentials'
      });
    }

    // 2. verify password
    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 3. sign token
    const token = await this.signToken(user.id, user.email);

    return {
      message: "Login successful",
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>("JWT_SECRET"),
      });
      return { valid: true, payload };
    } catch {
      return { valid: false, payload: null };
    }
  }

  private async signToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email },
      { secret: this.config.get<string>("JWT_SECRET") },
    );
  }
}
