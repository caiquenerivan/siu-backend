import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed...');

  // 1. Criar Hash da senha (obrigatório para o login funcionar)
  const password = await bcrypt.hash('12345678', 10);

  // 2. Criar ADMIN (Usamos upsert para não dar erro se rodar 2x)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@frota.com' },
    update: {}, // Se já existe, não faz nada
    create: {
      email: 'admin@frota.com',
      name: 'Administrador Supremo',
      password,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`👤 Admin criado: ${admin.email}`);

  // 3. Criar um Motorista de Teste
  const motorista = await prisma.user.upsert({
    where: { email: 'motorista@frota.com' },
    update: {},
    create: {
      email: 'motorista@frota.com',
      name: 'João da Silva',
      password, // Mesma senha '123456'
      role: 'MOTORISTA',
      isActive: true,
      // Criando o perfil do Driver aninhado (Relacionamento)
      driver: {
        create: {
          cnh: '11111111111',
          status: 'ATIVO',
          company: 'Transportes Rápidos',
          // Data simulada para o futuro
          toxicologyExam: new Date('2026-12-31T00:00:00Z'), 
        }
      }
    },
  });

  console.log(`🚛 Motorista criado: ${motorista.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });