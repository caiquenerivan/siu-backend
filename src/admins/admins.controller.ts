import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator'; // Importe o decorator
import { RolesGuard } from '../auth/guards/roles.guard'; // Importe o guard
import { Role } from '../auth/enums/role.enum'; // Importe o enum
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('admins')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protege TODAS as rotas de admins
@Roles(Role.ADMIN)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.adminsService.findAll(paginationDto);
  }

  @Get('by-user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.adminsService.findByUserId(userId);
  }

  @Patch('by-user/:userId')
  updateByUserId(@Param('userId') userId: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminsService.updateByUserId(userId, updateAdminDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminsService.update(id, updateAdminDto);
  }

  

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminsService.remove(id);
  }

}