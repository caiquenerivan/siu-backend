import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // 1. CREATE
  async create(data: CreateVehicleDto) {
    // Verifica duplicidade de placa
    const vehicleExists = await this.prisma.vehicle.findUnique({
      where: { plate: data.plate },
    });

    if (vehicleExists) {
      throw new BadRequestException('Já existe um veículo com esta placa.');
    }
    const vehicleWithSameRenavam = await this.prisma.vehicle.findUnique({
      where: { renavam: data.renavam },
    });

    if (vehicleWithSameRenavam) {
      throw new BadRequestException('Já existe um veículo com este RENAVAM.');
    }

    const { driverId, companyId, licensingDate, ...vehicleData } = data;

    return this.prisma.vehicle.create({
      data: {
      ...vehicleData, // Espalha os dados comuns (model, brand, color, etc)
      licensingDate: licensingDate ? new Date(licensingDate) : undefined,
      
      // LÓGICA DE PROTEÇÃO:
      // Só tenta conectar o motorista se driverId existir E não for string vazia
      driver: (driverId && driverId !== '') 
        ? { connect: { id: driverId } } 
        : undefined,

      // Mesma coisa para a empresa
      company: (companyId && companyId !== '') 
        ? { connect: { id: companyId } } 
        : undefined,
    },
    });
  }

  // 2. FIND ALL
  async findAll(paginationDto: PaginationDto) {
    
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        skip: skip,
        take: limit,
        orderBy: { model: 'asc' },
        include: {
          // Mostra quem está dirigindo o carro no momento (se houver)
          driver: {
            select: {
              id: true,
              user: { select: { name: true, email: true} } // Pega o nome do motorista via relação User
            }
          },
          company: {
            select: {
              id: true,
              user: { 
                select: { 
                  name: true, 
                  cnpj: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      this.prisma.vehicle.count(),
    ]);

    return {
      data: vehicles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }


  async findByDriver(driverId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { driverId },
        skip: skip,
        take: limit,
        include: {
          driver: {
          include: { user: { select: { name: true, email: true } } }
        },
        company: {
          select: {
            id: true,
            user: { 
              select: { 
                name: true, 
                cnpj: true,
                email: true
              }
            }
          }
        }
      }
    }),
      this.prisma.vehicle.count({ where: { driverId } }),
    ]);

    return {
      data: vehicles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  } 

  async findByCompany(companyId: string, paginationDto: PaginationDto) {      
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const filter = { companyId: companyId };

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { companyId },
        skip: skip,
        take: limit,
        include: {
          driver: {
            include: { user: { select: { name: true, email: true } } }
        },
        company: {
          select: {
            id: true,
            user: { 
              select: { 
                name: true, 
                cnpj: true,
                email: true
              }
            }
          }
        }
      }
    }),
    this.prisma.vehicle.count({ where: filter }),
    ]);

    return {
      data: vehicles,
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
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: {
          include: { user: { select: { name: true, email: true } } }
        },
        company: {
          select: {
            id: true,
            user: { 
              select: { 
                name: true, 
                cnpj: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    return vehicle;
  }
  
  // 4. UPDATE
  async update(id: string, data: UpdateVehicleDto) {
    await this.findOne(id); // Garante que existe

    if (data.driverId === '' || data.driverId === null) {
      data.driverId = undefined;
    }

    // Se estiver tentando mudar a placa, verifica se a nova já não existe
    if (data.plate) {
      const plateExists = await this.prisma.vehicle.findUnique({
        where: { plate: data.plate },
      });
      // Verifica se existe E se não é o próprio carro que estamos editando
      if (plateExists && plateExists.id !== id) {
        throw new BadRequestException('Esta placa já está em uso por outro veículo.');
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        // Se a data vier, converte. Se não, undefined.
        licensingDate: data.licensingDate ? new Date(data.licensingDate) : undefined,
      },
    });
  }

  // 5. REMOVE
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}