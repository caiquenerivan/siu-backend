import { PrismaClient, UserRole, StatusMotorista, StatusVeiculo } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed do Banco de Dados...');

  // 1. LIMPEZA (Ordem importa por causa das chaves estrangeiras)
  // Apagamos primeiro os filhos, depois os pais
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Banco limpo.');

  // Senha padrão para todos os usuários: "123456"
  const hashedPassword = await bcrypt.hash('123456', 10);

  // ====================================================================
  // 2. CRIAR ADMIN (Superusuário da Plataforma)
  // ====================================================================
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador Geral',
      email: 'admin@plataforma.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      admin: {
        create: {
          region: 'Matriz - SP',
        },
      },
    },
  });
  console.log(`✅ Admin criado: ${adminUser.email}`);

  // ====================================================================
  // 3. CRIAR EMPRESA (Transportadora Exemplo)
  // ====================================================================
  // A empresa é um USUÁRIO no sistema (tem login)
  const companyUser = await prisma.user.create({
    data: {
      name: 'Transportadora Rápida LTDA',
      email: 'contato@rapida.com',
      password: hashedPassword,
      role: UserRole.COMPANY,
      cnpj: '12.345.678/0001-90', // CNPJ fica no User agora
      company: {
        create: {
          address: 'Av. das Nações, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000',
          phone: '(11) 99999-0000',
        },
      },
    },
    include: { company: true }, // Incluímos para pegar o ID da Company criada
  });
  
  const companyId = companyUser.company?.id;

  if (!companyId) throw new Error('Falha ao criar empresa');
  console.log(`✅ Empresa criada: ${companyUser.name}`);


  // ====================================================================
  // 4. CRIAR OPERADOR (Vinculado à Empresa)
  // ====================================================================
  const operatorUser = await prisma.user.create({
    data: {
      name: 'Carlos Operador',
      email: 'carlos@rapida.com',
      password: hashedPassword,
      role: UserRole.OPERADOR,
      cpf: '111.222.333-44',
      operator: {
        create: {
          region: 'Filial Sul',
          company: { connect: { id: companyId } }, // Vínculo com a empresa
        },
      },
    },
  });
  console.log(`✅ Operador criado: ${operatorUser.email}`);


  // ====================================================================
  // 5. CRIAR MOTORISTAS (Vinculados à Empresa)
  // ====================================================================
  
  // Motorista 1: João
  const driverJoao = await prisma.user.create({
    data: {
      name: 'João Caminhoneiro',
      email: 'joao@rapida.com',
      password: hashedPassword,
      role: UserRole.MOTORISTA,
      cpf: '222.333.444-55',
      driver: {
        create: {
          cnh: '12345678900',
          status: StatusMotorista.ATIVO,
          company: { connect: { id: companyId } },
        },
      },
    },
    include: { driver: true },
  });

  // Motorista 2: Pedro (Pendente)
  const driverPedro = await prisma.user.create({
    data: {
      name: 'Pedro Novato',
      email: 'pedro@rapida.com',
      password: hashedPassword,
      role: UserRole.MOTORISTA,
      cpf: '333.444.555-66',
      driver: {
        create: {
          cnh: '09876543211',
          status: StatusMotorista.PENDENTE,
          company: { connect: { id: companyId } },
        },
      },
    },
  });
  console.log(`✅ Motoristas criados: João e Pedro`);


  // ====================================================================
  // 6. CRIAR VEÍCULOS (Frota da Empresa)
  // ====================================================================
  
  await prisma.vehicle.create({
    data: {
      brand: 'Volvo',
      model: 'FH 540',
      plate: 'ABC-1234',
      renavam: '123456789',
      year: '2023',
      color: 'Branco',
      status: StatusVeiculo.REGULAR,
      licensingDate: new Date(), // Data de hoje
      ownerName: 'Transportadora Rápida LTDA',
      
      // Vinculado à Empresa
      company: { connect: { id: companyId } },
      
      // Vinculado ao Motorista João (Ele está dirigindo este agora)
      driver: { connect: { id: driverJoao.driver?.id } },
    },
  });

  await prisma.vehicle.create({
    data: {
      brand: 'Scania',
      model: 'R 450',
      plate: 'XYZ-9876',
      renavam: '987654321',
      year: '2022',
      color: 'Vermelho',
      status: StatusVeiculo.REGULAR,
      licensingDate: new Date(),
      ownerName: 'Transportadora Rápida LTDA',
      
      // Vinculado apenas à Empresa (Sem motorista no momento)
      company: { connect: { id: companyId } },
    },
  });

  console.log(`✅ Veículos criados.`);
  console.log('🚀 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });