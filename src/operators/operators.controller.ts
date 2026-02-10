import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterCompanyDto } from 'src/common/dto/filterCompany.dto';

@Controller('operators')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege TODAS as rotas de operators
@Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR )
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMPANY)
  create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.operatorsService.findAll(paginationDto);
  }

  @Get('by-company')
  @Roles(Role.ADMIN, Role.COMPANY)
  findByCompany(@Query() query: FilterCompanyDto) {
    const { companyId, ...paginationDto} = query;
    return this.operatorsService.findByCompany(companyId, paginationDto);
  }

  @Get('by-user/:id')
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  findByUserId(@Param('id') id: string) {
    return this.operatorsService.findByUserId(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMPANY, Role.OPERADOR)
  findOne(@Param('id') id: string) {
    return this.operatorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COMPANY)
  update(@Param('id') id: string, @Body() updateOperatorDto: UpdateOperatorDto) {
    return this.operatorsService.update(id, updateOperatorDto);
  }

  @Patch('by-user/:userId')
  @Roles(Role.OPERADOR)
  updateByUserId(@Param('userId') userId: string, @Body() updateOperatorDto: UpdateOperatorDto) {
    return this.operatorsService.updateByUserId(userId, updateOperatorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COMPANY)
  remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }
}
