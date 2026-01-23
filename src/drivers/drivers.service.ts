import { Injectable,NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import * as bcrypt from 'bcrypt'; // npm install bcrypt
import { StatusMotorista, UserRole } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}
  
  
  // 1. CREATE (Protegido)
 async create(data: CreateDriverDto) {
    // Verificar se email ou CNH já existem antes de iniciar a transação
    const userExists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) throw new BadRequestException('Email já cadastrado');

    const driverExists = await this.prisma.driver.findUnique({ where: { cnh: data.cnh } });
    if (driverExists) throw new BadRequestException('CNH já cadastrada');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // TRANSAÇÃO: Ou cria os dois, ou não cria nada.
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o User
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: UserRole.MOTORISTA, // Força a role correta
        },
      });

      // 2. Cria o Driver vinculado ao User
      const newDriver = await tx.driver.create({
        data: {
          cnh: data.cnh,
          company: data.company,
          photoUrl: data.photoUrl,
          toxicologyExam: data.toxicologyExam,
          status: data.status || StatusMotorista.PENDENTE,
          currentVehicleId: data.currentVehicleId,
          userId: newUser.id, // VINCULO AQUI
        },
        include: { user: true }, // Retorna com os dados do usuário
      });

      return newDriver;
    });
  }


  // 2. FIND ALL (Protegido - Admin vê tudo)
async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Usamos Promise.all para executar as duas consultas ao mesmo tempo (Paralelismo)
    const [drivers, total] = await Promise.all([
      // 1. Busca os dados da página atual
      this.prisma.driver.findMany({
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
          },
          vehicle: true 
        },
      }),

      // 2. Conta o total de registros (para saber quantas páginas existem)
      this.prisma.driver.count(),
    ]);

    // Retorno estruturado para o Frontend
    return {
      data: drivers,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
}

  // 3. FIND ONE (PÚBLICO - Cuidado com dados sensíveis)
  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      // SELECT: Filtra o que o público pode ver
      include: {
        user: { select: { name: true, email: true, isActive: true } },
        vehicle: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Motorista não encontrado`);
    }

    return driver;
  }

  // --- 4. UPDATE (Protegido) ---
  async update(id: string, data: UpdateDriverDto) {
      // 1. Garante que o motorista existe
    await this.findOne(id);

    // 2. Separa os dados: O que é do User e o que é do Driver?
    // Se o DTO tiver senha, precisaria de hash, mas vamos focar em nome/email/status
    const { 
      name, 
      email, 
      currentVehicleId, 
      //status, 
      ...driverData 
    } = data;


    return this.prisma.driver.update({
      where: { id },
      data: {
        // Atualiza campos da tabela 'driver' (CNH, Company, etc)
        ...driverData,

        //status: status,
        
        // Atualiza relacionamento com Veículo (se enviado)
        vehicle: currentVehicleId 
          ? { connect: { id: currentVehicleId } } 
          : undefined,

        // ATUALIZAÇÃO ANINHADA: Atualiza a tabela 'user' (Pai) ao mesmo tempo
        user: {
          update: {
            // Só passa os campos se eles vieram no DTO
            ...(name && { name }),
            ...(email && { email }),
          },
        },
      },
      include: { user: true, vehicle: true }, // Retorna o objeto atualizado completo
    });
  }


  // 5. REMOVE (Protegido)
  async remove(id: string) {
    // 1. Busca o motorista para pegar o ID do Usuário dele
    const driver = await this.findOne(id);

    // 2. Deleta o USUÁRIO (Pai). 
    // Graças ao "onDelete: Cascade" no schema, o registro em 'drivers' também será apagado.
    return this.prisma.user.delete({
      where: { id: driver.userId },
    });
  }

  // --- BUSCA PÚBLICA (QR Code) Atualizada ---
  async findByPublicToken(token: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { publicToken: token },
      select: {
        photoUrl: true,
        status: true,
        company: true,
        cnh: true,
        toxicologyExam: true,
        // Agora o nome vem da tabela User
        user: {
          select: {
            name: true, 
            updatedAt: true,
            createdAt: true, 
          },
        },
        vehicle: {
          select: { model: true, color: true, plate: true },
        },
      },
    });

    if (!driver) throw new NotFoundException('Link Inválido ou Expirado');
    
    // Opcional: Flatten (achatar) o objeto para o frontend receber { name: "...", photoUrl: "..." }
    // em vez de { user: { name: "..." }, photoUrl: "..." }
    return driver;
  }
}
