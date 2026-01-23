import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('buffer-to-stream');

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'frota-drivers' },
        (error, result) => {
          // 1. Se der erro no Cloudinary, rejeita
          if (error) return reject(error);

          // 2. CORREÇÃO: Se não tiver resultado (undefined), rejeita também
          if (!result) {
            return reject(new Error('Erro ao fazer upload: Resposta vazia do Cloudinary'));
          }

          // 3. Agora o TS sabe que 'result' existe com certeza
          resolve(result.secure_url);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }
}