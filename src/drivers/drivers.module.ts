import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, 
    CloudinaryModule // <--- ADICIONE AQUI
  ],
  controllers: [DriversController],
  providers: [DriversService],
})
export class DriversModule {}
