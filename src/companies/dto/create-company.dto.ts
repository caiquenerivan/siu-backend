import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O CNPJ é obrigatório.' })
  @IsString()
  @Length(14, 18, { message: 'CNPJ deve ter entre 14 e 18 caracteres.' })
  cnpj: string;

  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string;

  // --- Campos Opcionais ---
  
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}