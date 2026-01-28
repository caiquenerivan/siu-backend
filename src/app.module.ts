import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { OperatorsModule } from './operators/operators.module';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { AdminsModule } from './admins/admins.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [PrismaModule, AuthModule, OperatorsModule, UsersModule, DriversModule, AdminsModule, VehiclesModule, CompaniesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
