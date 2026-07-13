import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessStoreService } from '../business/business-store.service';
import type {
  CommerceCartItem,
  CommerceOrderAddressSnapshot,
  CommerceOrderDetail,
} from '../business/business.types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sumGoodsTotalFen(items: CommerceCartItem[]) {
  return items.reduce((sum, item) => sum + item.priceFen * item.qty, 0);
}

function sumItemCount(items: CommerceCartItem[]) {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

function buildOrderNo(timestamp: number) {
  const date = new Date(timestamp);
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${yyyy}${mm}${dd}${hh}${min}${ss}${ms}`;
}

@Injectable()
export class OrderService {
  constructor(private readonly store: BusinessStoreService) {}

  async listOrders(userId: string) {
    const userState = await this.store.getUserState(userId);
    return {
      items: clone(
        [...userState.orders].sort((left, right) => right.updatedAt - left.updatedAt),
      ),
    };
  }

  async getOrderDetail(userId: string, orderId: string) {
    const order = await this.findOrder(userId, orderId);
    if (!order) throw new NotFoundException('订单不存在');
    return clone(order);
  }

  async createOrder(
    userId: string,
    payload: {
      source?: 'buy_now' | 'cart';
      items?: CommerceCartItem[];
      shippingMethod?: 'express';
      payMethod?: 'wechat_pay';
      address?: CommerceOrderAddressSnapshot;
    },
  ) {
    const items = Array.isArray(payload.items) ? clone(payload.items) : [];
    const address = payload.address;
    if (!items.length) throw new BadRequestException('暂无可下单商品');
    if (!address?.name || !address.phone || !address.detail) {
      throw new BadRequestException('收货地址无效');
    }

    const now = Date.now();
    const order: CommerceOrderDetail = {
      id: `order-${now}-${Math.random().toString(36).slice(2, 8)}`,
      orderNo: buildOrderNo(now),
      status: 'pending_payment',
      source: payload.source === 'cart' ? 'cart' : 'buy_now',
      items,
      goodsTotalFen: sumGoodsTotalFen(items),
      deliveryFeeFen: 0,
      payableTotalFen: sumGoodsTotalFen(items),
      itemCount: sumItemCount(items),
      address: clone(address),
      payMethod: 'wechat_pay',
      shippingMethod: 'express',
      timeline: { createdAt: now },
      updatedAt: now,
    };

    await this.store.updateUserState(userId, (userState) => {
      userState.orders.unshift(order);
      if (order.source === 'cart') {
        const cartIds = new Set(items.map(item => item.id));
        userState.cartItems = userState.cartItems.filter(item => !cartIds.has(item.id));
      }
    });

    return { order: clone(order) };
  }

  async payOrder(userId: string, orderId: string) {
    return await this.updateOrder(userId, orderId, (order) => {
      if (order.status !== 'pending_payment') {
        throw new BadRequestException('当前订单不可支付');
      }
      const now = Date.now();
      order.status = 'pending_receipt';
      order.timeline.paidAt = now;
      order.timeline.cancelledAt = undefined;
      order.cancelRequest = undefined;
      order.updatedAt = now;
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    return await this.updateOrder(userId, orderId, (order) => {
      if (order.status !== 'pending_payment') {
        throw new BadRequestException('当前订单不可直接取消');
      }
      const now = Date.now();
      order.status = 'cancelled';
      order.timeline.cancelledAt = now;
      order.updatedAt = now;
      order.cancelRequest = undefined;
    });
  }

  async requestCancel(
    userId: string,
    orderId: string,
    payload: { reasonCategory?: string; reason?: string },
  ) {
    return await this.updateOrder(userId, orderId, (order) => {
      if (order.status !== 'pending_receipt') {
        throw new BadRequestException('当前订单不可申请取消');
      }
      const reasonCategory = (payload.reasonCategory ?? '').trim();
      const reason = (payload.reason ?? '').trim();
      if (!reasonCategory || !reason) {
        throw new BadRequestException('取消原因与说明不能为空');
      }
      order.cancelRequest = {
        status: 'requested',
        requestedAt: Date.now(),
        reasonCategory,
        reason,
      };
      order.updatedAt = Date.now();
    });
  }

  async confirmReceipt(userId: string, orderId: string) {
    return await this.updateOrder(userId, orderId, (order) => {
      if (order.status !== 'pending_receipt') {
        throw new BadRequestException('当前订单不可确认收货');
      }
      if (order.cancelRequest?.status === 'requested') {
        throw new BadRequestException('取消申请审核中，暂不可确认收货');
      }
      const now = Date.now();
      order.status = 'completed';
      order.timeline.completedAt = now;
      order.updatedAt = now;
    });
  }

  async updateAddress(
    userId: string,
    orderId: string,
    payload: { address?: CommerceOrderAddressSnapshot },
  ) {
    return await this.updateOrder(userId, orderId, (order) => {
      if (order.status !== 'pending_payment') {
        throw new BadRequestException('当前订单不可修改收货地址');
      }
      const address = payload.address;
      if (!address?.name || !address.phone || !address.detail) {
        throw new BadRequestException('收货地址无效');
      }
      order.address = clone(address);
      order.updatedAt = Date.now();
    });
  }

  private async updateOrder(
    userId: string,
    orderId: string,
    updater: (order: CommerceOrderDetail) => void,
  ) {
    return await this.store.updateUserState(userId, (userState) => {
      const order = userState.orders.find(item => item.id === orderId);
      if (!order) throw new NotFoundException('订单不存在');
      updater(order);
      return { order: clone(order) };
    });
  }

  private async findOrder(userId: string, orderId: string) {
    const userState = await this.store.getUserState(userId);
    return userState.orders.find(item => item.id === orderId) ?? null;
  }
}
