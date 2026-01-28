import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Certifique-se de que seu DTO tem name, email, password e os dados do operador
import { CreateOperatorDto } from './dto/create-operator.dto'; 
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}


/*
  async create(data: CreateOperatorDto) {
    // Verifica email duplicado na tabela USER
    const userExists = await this.prisma.user.findUnique({ 
        where: { email: data.email } 
    });
    if (userExists) throw new BadRequestException('Email já cadastrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Transação: Cria User + Operator
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o Usuário base
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          cpf: data.cpf,
          role: UserRole.OPERADOR, // Define a role fixa
        },
      });

      // 2. Cria o Operador vinculado
      return tx.operator.create({
        data: {
          region: data.region,
          companyId: data.companyId,
          userId: newUser.id,    // Vínculo
        },
        include: { user: true },
      });
    });
  }
  */

  async create(createOperatorDto: CreateOperatorDto) {
    // 1. Verifica duplicidade de email
    const userExists = await this.prisma.user.findUnique({
      where: { email: createOperatorDto.email },
    });

    if (userExists) throw new BadRequestException('Email já cadastrado');


    // 2. Hash da senha
    const hashedPassword = await bcrypt.hash(createOperatorDto.password, 10);

    // 3. Prepara conexão com a empresa (se houver ID)
    // O tipo Prisma.CompanyCreateNestedOneWithoutOperatorsInput ajuda o TS a não se perder
    let companyConnect: Prisma.CompanyCreateNestedOneWithoutOperatorsInput | undefined = undefined;

    if (createOperatorDto.companyId) {
      companyConnect = {
        connect: { id: createOperatorDto.companyId }
      };
    }

    // 4. Criação Transactional
    const operator = await this.prisma.$transaction(async (prisma) => {
      // 4.1 Cria User
      const newUser = await prisma.user.create({
        data: {
          name: createOperatorDto.name,
          email: createOperatorDto.email,
          password: hashedPassword,
          cpf: createOperatorDto.cpf,
          role: UserRole.OPERADOR, // <--- CORRIGIDO: Deve ser igual ao schema.prisma
        },
      });

      // 4.2 Cria Operador
      return prisma.operator.create({
        data: {
          userId: newUser.id,
          // Agora o DTO tem esses campos, o erro vai sumir
          region: createOperatorDto.region,          
          // Conecta via ID (objeto ou undefined)
          companyId: createOperatorDto.companyId || (companyConnect?.connect?.id),
        },
        include: { 
          user: true, 
          company: true // Se der erro aqui, é porque faltou o 'npx prisma generate'
        },
      });
    });

    return operator;
  }
  // ... resto dos métodos (findAll, etc)


  // 2. FIND ALL
  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Usamos Promise.all para executar as duas consultas ao mesmo tempo (Paralelismo)
    const [operator, total] = await Promise.all([
      // 1. Busca os dados da página atual
      this.prisma.operator.findMany({
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
            select: { id: true, cpf: true, name: true, email: true, isActive: true } 
          },
          company: true,
        },
      }),

      // 2. Conta o total de registros (para saber quantas páginas existem)
      this.prisma.operator.count(),
    ]);

    // Retorno estruturado para o Frontend
    return {
      data: operator,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }
  

  // 3. FIND ONE
  async findOne(id: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, isActive: true } },
      },
    });

    if (!operator) throw new NotFoundException('Operador não encontrado');
    return operator;
  }

  // 4. UPDATE
  async update(id: string, data: UpdateOperatorDto) {
    await this.findOne(id);

    const { name, cpf, email, password, isActive, companyId, ...operatorData } = data;

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    return this.prisma.operator.update({
      where: { id },
      data: {
        ...operatorData,
        user: {
          update: {
            ...(name && { name }),
            ...(email && { email }),
            ...(cpf && { cpf }),
            ...(isActive !== undefined && { isActive }),
            ...(hashedPassword && { password: hashedPassword }),
          },
        },
        ...(companyId && {
          company: {
            connect: { id: companyId },
          },
        }),
      },
      include: { user: true, company: true},
    });
  }

  // 5. REMOVE
  async remove(id: string) {
    const operator = await this.findOne(id);
    // Deleta o Pai (User), o Cascade deleta o Operador
    return this.prisma.user.delete({
      where: { id: operator.userId },
    });
  }
}