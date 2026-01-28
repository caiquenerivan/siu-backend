import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'; // Não esqueça de importar o bcrypt
import { UserRole } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCompanyDto) {
    // 1. Verifica se o email já está em uso na tabela de Usuários
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    // 2. Verifica se o CNPJ já existe (opcional, mas recomendado)
    const cnpjExists = await this.prisma.user.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (cnpjExists) {
      throw new ConflictException('Já existe uma empresa com este CNPJ.');
    }

    // 3. Criptografa a senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. Criação Transactional (User + Company)
    const company = await this.prisma.$transaction(async (prisma) => {
      // Cria o Usuário base
      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          cnpj: data.cnpj,
          password: hashedPassword,
          role: UserRole.COMPANY, // Certifique-se de adicionar 'COMPANY' ao seu Enum ou use string
        },
      });

      // Cria a Empresa vinculada
      return prisma.company.create({
        data: {
          userId: newUser.id,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          phone: data.phone,
        },
        include: { user: true }, // Retorna os dados combinados
      });
    });

    return company;
  }

  // --- O Resto do CRUD (findAll, update) também muda ligeiramente ---

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { user: { name: 'asc' } },
      // Se quiser saber quantos operadores tem em cada empresa:
      include: {
        user: true,
        _count: {
          select: { operators: true } 
        }
      }
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        user: true,
        operators: {
          include: { user: true } // Traz os operadores vinculados
        }
      }
    });

    if (!company) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada.`);
    }

    return company;
  }

// --- Update (Com suporte a atualizar User e Company) ---
  async update(id: string, data: UpdateCompanyDto) {
    await this.findOne(id);

    // Separamos dados do User vs dados da Company
    const { name, email, cnpj, password, ...companyData } = data;

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        // Dados da tabela Company (Endereço, CNPJ, etc)
        ...companyData,

        // Dados da tabela User (Nome, Email, Senha)
        user: {
          update: {
            ...(name && { name }),
            ...(cnpj && { cnpj }),
            ...(email && { email }),
            ...(hashedPassword && { password: hashedPassword }),
          }
        }
      },
      include: { user: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.company.delete({
      where: { id },
    });
  }

  // ... (findOne e remove seguem a mesma lógica de incluir 'user')
}