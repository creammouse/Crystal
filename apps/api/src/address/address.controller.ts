import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AddressService } from './address.service';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('account/addresses')
@UseGuards(AuthGuard('jwt'))
export class AddressController {
  constructor(private readonly addresses: AddressService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.addresses.listAddresses(req.user.userId);
  }

  @Get('default')
  getDefault(@Req() req: AuthedRequest) {
    return this.addresses.getDefaultAddress(req.user.userId);
  }

  @Get(':id')
  getOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.addresses.getAddress(req.user.userId, id);
  }

  @Post()
  save(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.addresses.saveAddress(req.user.userId, body as never);
  }

  @Post(':id/default')
  setDefault(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.addresses.setDefault(req.user.userId, id);
  }

  @Delete(':id')
  delete(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.addresses.deleteAddress(req.user.userId, id);
  }
}
