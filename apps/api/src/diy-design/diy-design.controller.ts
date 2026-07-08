import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { DiyDesignService } from './diy-design.service';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('diy/designs')
@UseGuards(AuthGuard('jwt'))
export class DiyDesignController {
  constructor(private readonly designs: DiyDesignService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.designs.list(req.user.userId);
  }

  @Get(':id')
  getOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.designs.getOne(req.user.userId, id);
  }

  @Post()
  save(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.designs.save(req.user.userId, body as never);
  }

  @Delete(':id')
  delete(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.designs.delete(req.user.userId, id);
  }
}
