import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto'; // Importe seu DTO de paginação atual

export class FilterDriverDto extends PaginationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID() // Descomente se for UUID mesmo
  driverId: string;
}