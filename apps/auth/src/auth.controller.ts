import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { AuthService } from "./auth.service";


@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Gateway sends: { cmd: 'register' }
  @MessagePattern({ cmd: "register" })
  register(@Payload() data: { name: string; email: string; password: string }) {
    return this.authService.register(data);
  }

  // Gateway sends: { cmd: 'login' }
  @MessagePattern({ cmd: "login" })
  login(@Payload() data: { email: string; password: string }) {
    return this.authService.login(data);
  }

  // Gateway sends: { cmd: 'verify_token' }
  // Used internally to validate JWT on protected routes
  @MessagePattern({ cmd: "verify_token" })
  verifyToken(@Payload() data: { token: string }) {
    return this.authService.verifyToken(data.token);
  }
}
