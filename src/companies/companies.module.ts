import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <--- Importante

@Module({
  imports: [PrismaModule], // <--- Adicione aqui
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService], // Útil se outros módulos precisarem buscar empresas
})
export class CompaniesModule {}