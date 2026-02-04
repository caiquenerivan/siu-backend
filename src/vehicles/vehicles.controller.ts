import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { FilterCompanyDto} from 'src/common/dto/filterCompany.dto';
import { FilterDriverDto } from 'src/common/dto/filterDriver.dto';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt')) // Apenas usuários logados mexem em veículos
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR, Role.MOTORISTA)
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get('by-company')
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  findByCompany(@Query() query: FilterCompanyDto) {
    const { companyId, ...paginationDto} = query;
    return this.vehiclesService.findByCompany(companyId, paginationDto);
  }

  @Get('by-driver')
  @Roles(Role.ADMIN, Role.COMPANY, Role.MOTORISTA)
  findByDriver(@Query() query: FilterDriverDto) {
    const { driverId, ...paginationDto} = query;
    return this.vehiclesService.findByDriver(driverId, paginationDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.vehiclesService.findAll(paginationDto);
  }  

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR, Role.MOTORISTA)
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COMPANY, Role.MOTORISTA)
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}