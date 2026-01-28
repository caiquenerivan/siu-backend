import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('operators')

@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege TODAS as rotas de operators
@Roles(Role.ADMIN || Role.OPERADOR)
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.operatorsService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.operatorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOperatorDto: UpdateOperatorDto) {
    return this.operatorsService.update(id, updateOperatorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }
}
