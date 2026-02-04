import { StatusMotorista } from "@prisma/client";
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateDriverDto {
  // --- Dados do USER ---
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  // --- Dados do DRIVER ---
  @IsNotEmpty()
  @IsString()
  cnh: string;

  @IsOptional()
  @IsString()
  companyId?: string;
  
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(StatusMotorista)
  status?: StatusMotorista;

  @IsOptional()
  @IsDateString()
  toxicologyExam?: string; 

}