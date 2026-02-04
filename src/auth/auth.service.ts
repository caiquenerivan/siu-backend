/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto) {
    // 1. Verifica se o e-mail já existe
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    // 2. Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Normalização da Role (Front manda 'MOTORISTA', Banco espera 'DRIVER'?)
    // Ajuste conforme seu schema.prisma. Se lá estiver 'MOTORISTA', mantenha.
    let dbRole: any = data.role;

    try {
      // 4. Transação: Cria User + Perfil (Company ou Driver) atomicamente
      const result = await this.prisma.$transaction(async (prisma) => {
        
        // A. Cria o Usuário Base
        const newUser = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            cpf: data.cpf,
            password: hashedPassword,
            role: dbRole,
          },
        });

        // B. Cria o Perfil Específico
        if (dbRole === 'COMPANY') {
          if (!data.cnpj) throw new BadRequestException('CNPJ é obrigatório para empresas.');
          
          // Verifica CNPJ único
          const cnpjExists = await prisma.user.findUnique({ where: { cnpj: data.cnpj } });
          if (cnpjExists) throw new ConflictException('CNPJ já cadastrado.');

          newUser.cnpj = data.cnpj;          

          await prisma.company.create({
            data: {
              userId: newUser.id,
            },
          });
        } 
        
        else if (dbRole === 'DRIVER' || dbRole === 'MOTORISTA') {
          if (!data.cnh) throw new BadRequestException('CNH é obrigatória para motoristas.');

          // Verifica CNH única
          const cnhExists = await prisma.driver.findUnique({ where: { cnh: data.cnh } });
          if (cnhExists) throw new ConflictException('CNH já cadastrada.');

          await prisma.driver.create({
            data: {
              cnh: data.cnh,
              userId: newUser.id,
              // companyId fica null por enquanto (motorista autônomo ou aguardando vínculo)
            },
          });
        }

        return newUser;
      });

      // 5. Retorna sucesso (sem a senha)
      return {
        message: 'Usuário cadastrado com sucesso!',
        userId: result.id,
        email: result.email,
      };

    } catch (error) {
        // Se der erro na transação, repassa a exceção correta
        if (error instanceof ConflictException || error instanceof BadRequestException) {
          throw error;
        }
        console.error(error);
        throw new BadRequestException('Erro ao criar conta. Verifique os dados.');
    }
  }

  /*

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
              region: dto.region,
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
  */
  // --- LOGIN MANUAL (Se você usa endpoint direto sem Guard) ---
  async signin(dto: SigninDto) {
    // 1. Busca na tabela USER (serve para Admin, Driver e Operator)
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        company: true,
        driver: true,
        operator: true,
        admin: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 2. Compara senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    let resolvedCompanyId: string | null = null;

    if (user.company) {
      resolvedCompanyId = user.company.id;
    } else if (user.driver) {
      resolvedCompanyId = user.driver.companyId;
    } else if (user.operator) {
      resolvedCompanyId = user.operator.companyId;
    }

    // 3. Gera Token
    // O payload leva o ID do User (sub) e a Role
    const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.company?.id, driver: user.driver?.id};

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,

        company: user.company,
        driver: user.driver,
        operator: user.operator,
        admin: user.admin, 
        companyId: resolvedCompanyId 
      },
    };
  }

  // --- VALIDAÇÃO (Usado pelo Passport Local Strategy, se tiver) ---
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique(
      { where: { email }, 
      include: {
        company: {select: {id: true}},
        driver: {select: {id: true}},
        operator: {select: {id: true}},
      }
    });

    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      const flatUser = {
        ...result,
        companyId: user.company?.id || null,
        driverId: user.driver?.id || null,
      }
      return flatUser;
    }
    return null;
  }

  // --- LOGIN (Usado pelo Controller após o LocalGuard validar) ---
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, companyId: user.companyId, driver: user.driverId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId, // <--- Força o envio deste campo
        driverId: user.driverId,
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