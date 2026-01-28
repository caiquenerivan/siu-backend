/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // --- REGISTRO (Gera User + Admin) ---
  async signup(dto: SignupDto) {
    // 1. Verificar se o email já existe na tabela USER
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('Email já está em uso');
    }

    // 2. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Criar User e Admin (Transação implícita do Prisma)
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,     // Fica na tabela User
          email: dto.email,   // Fica na tabela User
          password: hashedPassword,
          role: 'ADMIN',      // Define a role
          
          // Cria o registro na tabela admin vinculado automaticamente
          admin: {
            create: {
              // name: dto.name, <--- REMOVIDO! (O nome já está no User)
              //company: dto.company,
              region: dto.region,
              //cpfCnpj: dto.cpfCnpj,
            },
          },
        },
        // Seleciona o retorno para não vazar senha
        select: {
          id: true,
          email: true,
          role: true,
          admin: {
            select: {
              //company: true, // Só campos que existem em Admin
              region: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Erro ao criar usuário');
    }
  }

  // --- LOGIN MANUAL (Se você usa endpoint direto sem Guard) ---
  async signin(dto: SigninDto) {
    // 1. Busca na tabela USER (serve para Admin, Driver e Operator)
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Compara senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Gera Token
    // O payload leva o ID do User (sub) e a Role
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // --- VALIDAÇÃO (Usado pelo Passport Local Strategy, se tiver) ---
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // --- LOGIN (Usado pelo Controller após o LocalGuard validar) ---
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: true,   // Traz dados da CNH, Foto, etc.
        admin: true,    // Traz dados de Admin
        operator: true, // Traz dados de Operador
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Remove a senha do retorno por segurança
    const { password, ...result } = user;
    
    return result;
  }
  
  // MÉTODOS DELETADOS: validateOperator, loginOperator
  // Motivo: Agora o signin/validateUser acima já resolvem para operadores também.
}