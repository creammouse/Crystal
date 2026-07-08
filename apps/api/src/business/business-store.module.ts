import { Global, Module } from '@nestjs/common';
import { BusinessStoreService } from './business-store.service';

@Global()
@Module({
  providers: [BusinessStoreService],
  exports: [BusinessStoreService],
})
export class BusinessStoreModule {}
