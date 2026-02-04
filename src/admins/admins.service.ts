import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { find } from 'rxjs';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE (Transação)
  async create(data: CreateAdminDto) {
    // Verifica se o email já existe na tabela pai (User)
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userExists) throw new BadRequestException('Email já cadastrado no sistema.');

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cria User + Admin atomicamente
    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: UserRole.ADMIN, // Importante: Define a Role correta
        },
      });

      return tx.admin.create({
        data: {
          //company: data.company,
          region: data.region,
          userId: newUser.id, // Vincula ao pai
        },
        include: {
          user: { // Retorna os dados do usuário criado, menos a senha
            select: { id: true, cpf: true, cnpj: true, name: true, email: true, role: true }
          }
        },
      });
    });
  }

  // 2. FIND ALL
  async findAll1() {
    return this.prisma.admin.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true, // Para saber se está bloqueado
          },
        },
      },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Usamos Promise.all para executar as duas consultas ao mesmo tempo (Paralelismo)
    const [admin, total] = await Promise.all([
      // 1. Busca os dados da página atual
      this.prisma.admin.findMany({
        skip: skip, // Pula os registros anteriores
        take: limit, // Pega apenas a quantidade do limite
        orderBy: { 
            // É importante ordenar para garantir que a paginação não fique "sambando"
            // Como drivers não tem createdAt no schema que vi antes, usei id ou user.createdAt
            // Se tiver createdAt em driver, use ele.
            user: { updatedAt: 'desc' } 
        },
        include: { 
          user: { 
            select: { id: true, name: true, email: true, isActive: true } 
          }
        },
      }),

      // 2. Conta o total de registros (para saber quantas páginas existem)
      this.prisma.admin.count(),
    ]);

    // Retorno estruturado para o Frontend
    return {
      data: admin,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }
  
  async findByUserId(userId: string) {
  const admin = await this.prisma.admin.findUnique({
    where: { userId },
    include: {

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  if (!admin) throw new NotFoundException('Administrador não encontrado para o usuário fornecido.');
  return admin;
}
  // 3. FIND ONE
  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!admin) throw new NotFoundException('Administrador não encontrado.');
    return admin;
  }

  

  // 4. UPDATE
  async update(id: string, data: UpdateAdminDto) {
    await this.findOne(id); // Garante que existe

    // Separa dados do User (Pai) dos dados do Admin (Filho)
    const { name, email, password, isActive, ...adminData } = data;

    // Se houver senha nova, faz o hash (opcional)
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    return this.prisma.admin.update({
      where: { id },
      data: {
        // Atualiza campos específicos do Admin
        ...adminData,
        
        // Atualiza campos do User (Pai) via relacionamento
        user: {
          update: {
            ...(name && { name }),
            ...(email && { email }),
            ...(isActive !== undefined && { isActive }),
            ...(hashedPassword && { password: hashedPassword }),
          },
        },
      },
      include: { user: { select: { name: true, email: true, isActive: true } } },
    });
  }

  async updateByUserId(userId: string, data: UpdateAdminDto) {
    await this.findByUserId(userId); // Garante que existe

    const { name, email, password, isActive, ...adminData } = data;

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    return this.prisma.admin.update({
      where: { userId },
      data: {
        // Atualiza campos específicos do Admin
        ...adminData,

        user: {
          update: {
            ...(name && { name }),
            ...(email && { email }),
            ...(isActive !== undefined && { isActive }),
            ...(hashedPassword && { password: hashedPassword }),
          },
        },
      },
    });
  } 

  // 5. REMOVE
  async remove(id: string) {
    const admin = await this.findOne(id);
    
    // Deletamos o USUÁRIO (Pai). 
    // Como configuramos "onDelete: Cascade" no schema, o registro em 'admins' some junto.
    return this.prisma.user.delete({
      where: { id: admin.userId },
    });
  }
}