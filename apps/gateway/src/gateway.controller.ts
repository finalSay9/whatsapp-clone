import { 
  Controller,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
  Param
 } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GatewayService } from './gateway.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { firstValueFrom } from "rxjs";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { GetUser } from '../decoarators/get-user.decorator';
import { JwtGuard } from '../guards/guard.jwt';


@ApiTags("Auth")
@Controller("Auth")
export class GatewayController {
  constructor(
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy,
    @Inject("MESSAGES_SERVICE") private readonly messagesClient: ClientProxy,
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

  // 👇 protected route — requires valid JWT
  @Get("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get current logged in user" })
  @ApiResponse({ status: 200, description: "Returns current user" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getMe(@GetUser() user: any) {
    return {
      message: "You are authenticated",
      user,
    };
  }

  @Get("messages/:recipientId")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get message history with a user" })
  getMessages(
    @Param("recipientId") recipientId: string,
    @GetUser("sub") userId: string,
  ) {
    return firstValueFrom(
      this.messagesClient.send(
        { cmd: "get_messages" },
        { userId, recipientId },
      ),
    );
  }
}
