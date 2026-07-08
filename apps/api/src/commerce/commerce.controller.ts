import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CommerceService } from './commerce.service';

type AuthedRequest = Request & { user: { userId: string } };

@Controller('commerce')
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Get('categories')
  listCategories() {
    return this.commerce.listCategories();
  }

  @Get('products')
  listProducts(
    @Query('categoryId') categoryId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.commerce.listProducts(
      categoryId,
      Number.parseInt(page ?? '1', 10) || 1,
      Number.parseInt(pageSize ?? '20', 10) || 20,
    );
  }

  @Get('products/:id')
  getProductDetail(@Param('id') id: string) {
    return this.commerce.getProductDetail(id);
  }

  @Get('cart')
  @UseGuards(AuthGuard('jwt'))
  listCart(@Req() req: AuthedRequest) {
    return this.commerce.listCart(req.user.userId);
  }

  @Post('cart/items')
  @UseGuards(AuthGuard('jwt'))
  addCartItem(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.commerce.addProductCartItem(req.user.userId, body);
  }

  @Post('cart/design-items')
  @UseGuards(AuthGuard('jwt'))
  addDesignCartItem(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.commerce.addDesignCartItem(req.user.userId, body);
  }

  @Patch('cart/items/:id')
  @UseGuards(AuthGuard('jwt'))
  updateCartItem(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.commerce.updateCartItemQuantity(req.user.userId, id, body);
  }

  @Delete('cart/items')
  @UseGuards(AuthGuard('jwt'))
  removeCartItems(@Req() req: AuthedRequest, @Body() body: { cartItemIds?: string[] }) {
    return this.commerce.removeCartItems(req.user.userId, body.cartItemIds ?? []);
  }

  @Delete('cart')
  @UseGuards(AuthGuard('jwt'))
  clearCart(@Req() req: AuthedRequest) {
    return this.commerce.removeCartItems(req.user.userId, []);
  }

  @Get('favorites')
  @UseGuards(AuthGuard('jwt'))
  listFavorites(@Req() req: AuthedRequest) {
    return this.commerce.listFavorites(req.user.userId);
  }

  @Post('favorites/toggle')
  @UseGuards(AuthGuard('jwt'))
  toggleFavorite(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.commerce.toggleFavorite(req.user.userId, body);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  listHistory(@Req() req: AuthedRequest) {
    return this.commerce.listHistory(req.user.userId);
  }

  @Post('history/visit')
  @UseGuards(AuthGuard('jwt'))
  recordHistory(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>) {
    return this.commerce.recordHistory(req.user.userId, body);
  }

  @Delete('history/:productId')
  @UseGuards(AuthGuard('jwt'))
  removeHistoryItem(@Req() req: AuthedRequest, @Param('productId') productId: string) {
    return this.commerce.removeHistoryItem(req.user.userId, productId);
  }

  @Delete('history')
  @UseGuards(AuthGuard('jwt'))
  clearHistory(@Req() req: AuthedRequest) {
    return this.commerce.clearHistory(req.user.userId);
  }
}
