import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional } from 'class-validator';
// Importe o Enum gerado pelo Prisma ou crie um TS se preferir
import { StatusVeiculo } from '@prisma/client'; 

export class CreateVehicleDto {
  @IsNotEmpty()
  @IsString()
  plate: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  brand: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsNotEmpty()
  @IsString()
  year: string;

  @IsOptional()
  @IsEnum(StatusVeiculo)
  status?: StatusVeiculo;

  @IsNotEmpty()
  @IsDateString() // Valida formato YYYY-MM-DD
  licensingDate: string;

  @IsNotEmpty()
  @IsString()
  renavam: string;

  @IsNotEmpty()
  @IsString()
  ownerName: string;

  @IsOptional()
  @IsString()
  driverId?: string; // Opcional, pode ser atribuído depois

  @IsOptional()
  @IsString()
  companyId?: string; // Opcional, pode ser atribuído depois
}