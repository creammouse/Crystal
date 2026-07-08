import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { OrderService } from './order.service';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('commerce/orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Get()
  listOrders(@Req() req: AuthedRequest) {
    return this.orders.listOrders(req.user.userId);
  }

  @Get(':id')
  getOrderDetail(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.getOrderDetail(req.user.userId, id);
  }

  @Post()
  createOrder(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.orders.createOrder(req.user.userId, body as never);
  }

  @Post(':id/pay')
  payOrder(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.payOrder(req.user.userId, id);
  }

  @Post(':id/cancel')
  cancelOrder(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.cancelOrder(req.user.userId, id);
  }

  @Post(':id/cancel-request')
  requestCancel(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.orders.requestCancel(req.user.userId, id, body as never);
  }

  @Post(':id/confirm-receipt')
  confirmReceipt(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.confirmReceipt(req.user.userId, id);
  }

  @Post(':id/address')
  updateAddress(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.orders.updateAddress(req.user.userId, id, body as never);
  }
}
