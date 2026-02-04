import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  role: 'COMPANY' | 'MOTORISTA' ; // Aceita o que vem do front

  // Campos opcionais dependendo da Role
  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsString()
  cnh?: string;

@IsOptional()
  @IsString()
  cpf?: string;
}