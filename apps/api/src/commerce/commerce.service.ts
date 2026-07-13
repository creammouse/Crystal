import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessStoreService } from '../business/business-store.service';
import { COMMERCE_CATEGORIES, COMMERCE_PRODUCTS } from '../business/catalog.seed';
import type {
  CommerceCartItem,
  CommerceFavoriteItem,
  CommerceHistoryItem,
  CommerceProductDetail,
} from '../business/business.types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function formatRecentActionLabel(date: Date, suffix = ''): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (date >= todayStart) return `今天 ${hh}:${mm}${suffix}`;
  if (date >= yesterdayStart) return `昨天 ${hh}:${mm}${suffix}`;
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${hh}:${mm}${suffix}`;
}

@Injectable()
export class CommerceService {
  constructor(private readonly store: BusinessStoreService) {}

  listCategories() {
    const items = COMMERCE_CATEGORIES.filter(item => item.isVisible).sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );
    return {
      items: clone(items),
      defaultCategoryId: items[0]?.id ?? '',
    };
  }

  listProducts(categoryId: string, page = 1, pageSize = 20) {
    const all = COMMERCE_PRODUCTS
      .filter(item => item.categoryId === categoryId)
      .map(item => this.toProductSummary(item));
    const start = Math.max(0, (page - 1) * pageSize);
    return {
      items: clone(all.slice(start, start + pageSize)),
      total: all.length,
      page,
      pageSize,
    };
  }

  async getProductDetail(productId: string, userId?: string) {
    const detail = this.findProductOrThrow(productId);
    const product = clone(detail);
    if (userId) {
      const userState = await this.store.getUserState(userId);
      product.isFavorited = userState.favoriteProductIds.includes(productId);
      product.favoriteCount = detail.favoriteCount + (product.isFavorited ? 1 : 0);
    }
    return product;
  }

  async listCart(userId: string) {
    const userState = await this.store.getUserState(userId);
    return { items: clone(userState.cartItems) };
  }

  async addProductCartItem(
    userId: string,
    payload: { productId?: string; skuId?: string; quantity?: number },
  ) {
    const detail = this.findProductOrThrow(payload.productId ?? '');
    const sku = detail.skus.find(item => item.id === payload.skuId);
    if (!sku) throw new BadRequestException('规格不存在');
    const qty = Math.max(1, Math.floor(payload.quantity ?? 1));

    return await this.store.updateUserState(userId, (userState) => {
      const existing = userState.cartItems.find(
        item =>
          item.kind === 'product'
          && item.productId === detail.id
          && item.skuId === sku.id,
      );
      if (existing && existing.kind === 'product') {
        existing.qty += qty;
        return {
          item: clone(existing),
          cartItemCount: this.countCartItems(userState.cartItems),
        };
      }

      const item: CommerceCartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'product',
        productId: detail.id,
        skuId: sku.id,
        title: detail.title,
        coverImageUrl: detail.coverImageUrl,
        specLabel: sku.label,
        priceFen: sku.priceFen,
        qty,
        selected: false,
      };
      userState.cartItems.unshift(item);
      return {
        item: clone(item),
        cartItemCount: this.countCartItems(userState.cartItems),
      };
    });
  }

  async addDesignCartItem(
    userId: string,
    payload: {
      designId?: string;
      designConfigSignature?: string;
      title?: string;
      specLabel?: string;
      priceFen?: number;
      quantity?: number;
    },
  ) {
    const designConfigSignature = (payload.designConfigSignature ?? '').trim();
    const title = (payload.title ?? '').trim();
    if (!designConfigSignature || !title) {
      throw new BadRequestException('设计商品信息不完整');
    }
    const qty = Math.max(1, Math.floor(payload.quantity ?? 1));
    const priceFen = Number(payload.priceFen ?? 0);

    return await this.store.updateUserState(userId, (userState) => {
      const existing = userState.cartItems.find(
        item =>
          item.kind === 'design'
          && item.designConfigSignature === designConfigSignature,
      );
      if (existing && existing.kind === 'design') {
        existing.qty += qty;
        existing.title = title;
        existing.specLabel = payload.specLabel;
        existing.priceFen = priceFen;
        existing.designId = payload.designId ?? existing.designId;
        return {
          item: clone(existing),
          cartItemCount: this.countCartItems(userState.cartItems),
        };
      }

      const item: CommerceCartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        kind: 'design',
        designId: (payload.designId ?? '').trim() || `design-${Date.now()}`,
        designConfigSignature,
        title,
        coverImageUrl: null,
        specLabel: payload.specLabel,
        priceFen,
        qty,
        selected: false,
      };
      userState.cartItems.unshift(item);
      return {
        item: clone(item),
        cartItemCount: this.countCartItems(userState.cartItems),
      };
    });
  }

  async updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    payload: { quantity?: number },
  ) {
    return await this.store.updateUserState(userId, (userState) => {
      const item = userState.cartItems.find(entry => entry.id === cartItemId);
      if (!item) throw new NotFoundException('购物车商品不存在');
      item.qty = Math.max(1, Math.min(99, Math.floor(payload.quantity ?? 1)));
      return {
        item: clone(item),
        cartItemCount: this.countCartItems(userState.cartItems),
      };
    });
  }

  async removeCartItems(userId: string, cartItemIds: string[]) {
    return await this.store.updateUserState(userId, (userState) => {
      if (!cartItemIds.length) {
        userState.cartItems = [];
        return { items: [] };
      }
      const targets = new Set(cartItemIds);
      userState.cartItems = userState.cartItems.filter(item => !targets.has(item.id));
      return { items: clone(userState.cartItems) };
    });
  }

  async listFavorites(userId: string) {
    const userState = await this.store.getUserState(userId);
    return { items: this.buildFavoriteItems(userState.favoriteProductIds) };
  }

  async toggleFavorite(
    userId: string,
    payload: { productId?: string; favorited?: boolean },
  ) {
    const product = this.findProductOrThrow(payload.productId ?? '');
    return await this.store.updateUserState(userId, (userState) => {
      const targets = new Set(userState.favoriteProductIds);
      if (payload.favorited) targets.add(product.id);
      else targets.delete(product.id);
      userState.favoriteProductIds = Array.from(targets);
      return {
        productId: product.id,
        isFavorited: userState.favoriteProductIds.includes(product.id),
        favoriteCount:
          product.favoriteCount
          + (userState.favoriteProductIds.includes(product.id) ? 1 : 0),
      };
    });
  }

  async listHistory(userId: string) {
    const userState = await this.store.getUserState(userId);
    return { items: this.buildHistoryItems(userState.history) };
  }

  async recordHistory(userId: string, payload: { productId?: string }) {
    const product = this.findProductOrThrow(payload.productId ?? '');
    return await this.store.updateUserState(userId, (userState) => {
      userState.history = userState.history.filter(item => item.productId !== product.id);
      userState.history.unshift({
        productId: product.id,
        viewedAt: Date.now(),
      });
      userState.history = userState.history.slice(0, 50);
      return { items: this.buildHistoryItems(userState.history) };
    });
  }

  async removeHistoryItem(userId: string, productId: string) {
    return await this.store.updateUserState(userId, (userState) => {
      userState.history = userState.history.filter(item => item.productId !== productId);
      return { items: this.buildHistoryItems(userState.history) };
    });
  }

  async clearHistory(userId: string) {
    return await this.store.updateUserState(userId, (userState) => {
      userState.history = [];
      return { items: [] };
    });
  }

  private buildFavoriteItems(productIds: string[]): CommerceFavoriteItem[] {
    return productIds
      .map((productId) => {
        const product = COMMERCE_PRODUCTS.find(item => item.id === productId);
        if (!product) return null;
        return {
          productId: product.id,
          title: product.title,
          coverImageUrl: product.coverImageUrl,
          priceFen: product.priceFen,
          savedAtLabel: formatRecentActionLabel(new Date(), ' 收藏'),
        };
      })
      .filter((item): item is CommerceFavoriteItem => item !== null);
  }

  private buildHistoryItems(
    history: Array<{ productId: string; viewedAt: number }>,
  ): CommerceHistoryItem[] {
    return history
      .map((entry) => {
        const product = COMMERCE_PRODUCTS.find(item => item.id === entry.productId);
        if (!product) return null;
        return {
          productId: product.id,
          title: product.title,
          coverImageUrl: product.coverImageUrl,
          priceFen: product.priceFen,
          viewedAtLabel: formatRecentActionLabel(new Date(entry.viewedAt)),
        };
      })
      .filter((item): item is CommerceHistoryItem => item !== null);
  }

  private findProductOrThrow(productId: string): CommerceProductDetail {
    const product = COMMERCE_PRODUCTS.find(item => item.id === productId);
    if (!product) throw new NotFoundException('商品不存在');
    return product;
  }

  private toProductSummary(product: CommerceProductDetail) {
    return {
      id: product.id,
      categoryId: product.categoryId,
      title: product.title,
      coverImageUrl: product.coverImageUrl,
      priceFen: product.priceFen,
      badges: clone(product.badges),
      stockStatus: product.stockStatus,
      isCustomizable: product.isCustomizable,
    };
  }

  private countCartItems(items: CommerceCartItem[]) {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }
}
