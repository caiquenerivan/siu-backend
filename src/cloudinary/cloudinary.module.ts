import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService], // <--- OBRIGATÓRIO: Exportar para outros usarem
})
export class CloudinaryModule {}