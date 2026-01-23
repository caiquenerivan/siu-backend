import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StatusMotorista } from '@prisma/client';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  // Recebe como string ISO e converte no service

  @IsOptional()
  @IsUUID()
  desvincularVeiculo?: boolean;
}