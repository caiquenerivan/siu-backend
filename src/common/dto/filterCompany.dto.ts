import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto'; // Importe seu DTO de paginação atual

export class FilterCompanyDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID() // Descomente se for UUID mesmo
  companyId: string;
}