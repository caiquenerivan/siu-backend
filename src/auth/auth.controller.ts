/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
//import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }
  */

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(AuthGuard('jwt')) // <--- Isso BLINDA a rota. Sem token = Erro 401.
  @Get('rota-protegida')
  getProfile(@Request() req) {
    // O "req.user" foi preenchido pelo JwtStrategy que criamos no Passo 1
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfileMe(@Request() req) {
    // O Guard já validou o token e colocou os dados no req.user
    return this.authService.getMe(req.user.userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login') 
  async login(@Body() signInDto: Record<string, any>) {
    // 1. Validar usuário
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Gerar Token
    return this.authService.login(user);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED) // Retorna 201 Created
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
