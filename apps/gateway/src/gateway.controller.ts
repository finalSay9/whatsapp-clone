import { 
  Controller,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Post
 } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayService } from './gateway.service';
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { firstValueFrom } from "rxjs";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";


@ApiTags("Auth")
@Controller("Auth")
export class GatewayController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
    private readonly gatewayService: GatewayService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "Email already in use" })
  async register(@Body() dto: RegisterDto) {
    // send message to Auth Service and wait for response
    return firstValueFrom(
      this.authClient.send({ cmd: "register" }, dto),
      //                👆 message pattern   👆 payload
    );
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Returns JWT token" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    return firstValueFrom(this.authClient.send({ cmd: "login" }, dto));
  }
}
