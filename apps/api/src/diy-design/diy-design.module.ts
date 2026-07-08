import { Module } from '@nestjs/common';
import { DiyDesignController } from './diy-design.controller';
import { DiyDesignService } from './diy-design.service';

@Module({
  controllers: [DiyDesignController],
  providers: [DiyDesignService],
})
export class DiyDesignModule {}
