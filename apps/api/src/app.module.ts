import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { BusinessStoreModule } from './business/business-store.module';
import { CommerceModule } from './commerce/commerce.module';
import { DiyDesignModule } from './diy-design/diy-design.module';
import { OrderModule } from './order/order.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BusinessStoreModule,
    PrismaModule,
    AuthModule,
    CommerceModule,
    OrderModule,
    AddressModule,
    DiyDesignModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
