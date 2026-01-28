// src/operators/dto/create-operator.dto.ts
import { IsEmail, IsString, IsOptional, IsNotEmpty, MinLength } from 'class-validator';
// Se você estiver usando validação (recomendado). Se não, remova os decorators.

export class CreateOperatorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string;

  // Campos Opcionais (conforme seu schema)
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  cpf?: string;
}