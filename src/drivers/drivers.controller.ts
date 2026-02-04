import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { UserPayload } from 'src/auth/models/user-payload-interface';
import { FilterCompanyDto } from 'src/common/dto/filterCompany.dto';

@Controller('drivers')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly cloudinaryService: CloudinaryService, // Injete o serviço
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  async create(@Body() body: any, @UploadedFile() file: Express.Multer.File,) {
    
    console.log('Dados recebidos:', body); // Para debug

    let photoUrl = '';
    if (file) {
      photoUrl = await this.cloudinaryService.uploadImage(file);
    }
    // 1. Montamos o objeto DTO manualmente, pois os dados vieram "soltos" no FormData
    // Nota: O FormData transforma tudo em string, então cuidado com datas/números
    const createDriverDto = {
      name: body.name,
      email: body.email,
      password: body.password,
      cnh: body.cnh,
      company: body.company,
      status: body.status || 'PENDENTE',
      // Converte string para Date, ou null se não vier
      toxicologyExam: body.toxicologyExam ? new Date(body.toxicologyExam) : null,
      photoUrl: photoUrl,
    };

    // 2. Se houver arquivo, faz upload no Cloudinary

    // 3. Envia para o serviço
    return this.driversService.create(createDriverDto as any);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))  
  @Roles(Role.ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.driversService.findAll(paginationDto);
  }


  
  @Get('by-company')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  findByCompany(@Query() query: FilterCompanyDto) {
    const { companyId, ...paginationDto} = query;
    return this.driversService.findByCompany(companyId, paginationDto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard('jwt'))  
  @Roles(Role.COMPANY, Role.ADMIN, Role.MOTORISTA, Role.OPERADOR)
  async update(
    @Param('id') id: string, 
    @Body() body: any, // Recebe como any pois vem do FormData (tudo string)
    @UploadedFile() file: Express.Multer.File,
  ) {

    let photoUrl = '';
    if (file) {
      photoUrl = await this.cloudinaryService.uploadImage(file);
    }
    const isoDate= new Date(body.toxicologyExam).toISOString();
    const updateDriverDto = {
      name: body.name,
      email: body.email,
      password: body.password,
      cnh: body.cnh,
      companyId: body.companyId,
      status: body.status || 'PENDENTE',
      toxicologyExam: isoDate || null,
      photoUrl: photoUrl,
    };
    return this.driversService.update(id, updateDriverDto as UpdateDriverDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @Roles(Role.COMPANY, Role.ADMIN, Role.MOTORISTA)  
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.driversService.remove(id, user);
  }

  @Get('by-user/:id')
  @UseGuards(AuthGuard('jwt'))  
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR, Role.MOTORISTA)
  findByUserId(@Param('id') id: string) {
    return this.driversService.findByUserId(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))  
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }


  // Exemplo de URL: http://localhost:3000/drivers/qrcode/123e4567-e89b...
  @Get('qrcode/:token') 
  // SEM @UseGuards aqui -> Aberto para o mundo
  findByToken(@Param('token') token: string) {
    return this.driversService.findByPublicToken(token);
  }
}
