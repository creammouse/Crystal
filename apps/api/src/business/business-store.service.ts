import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AddressBookItem,
  CommerceCartItem,
  CommerceOrderAddressSnapshot,
  CommerceOrderCancelRequest,
  CommerceOrderDetail,
  CommerceOrderTimeline,
  SavedDiyDesign,
  UserBusinessState,
} from './business.types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toDate(value: number): Date {
  return new Date(value);
}

function toTimestamp(value: Date): number {
  return value.getTime();
}

@Injectable()
export class BusinessStoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserState(userId: string): Promise<UserBusinessState> {
    return await this.readStateFromDatabase(userId);
  }

  async updateUserState<T>(
    userId: string,
    updater: (current: UserBusinessState) => T | Promise<T>,
  ): Promise<T> {
    const current = clone(await this.getUserState(userId));
    const result = await updater(current);
    await this.replaceUserState(userId, current);
    return result;
  }

  private async readStateFromDatabase(userId: string): Promise<UserBusinessState> {
    const [cartItems, favorites, history, orders, addresses, designs] = await this.prisma.$transaction([
      this.prisma.userCartItem.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.userFavorite.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.userHistory.findMany({
        where: { userId },
        orderBy: [{ viewedAt: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.userOrder.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.userAddress.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.userDiyDesign.findMany({
        where: { userId },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      cartItems: cartItems.map(item => this.mapCartItem(item)),
      favoriteProductIds: favorites.map(item => item.productId),
      history: history.map(item => ({
        productId: item.productId,
        viewedAt: toTimestamp(item.viewedAt),
      })),
      orders: orders.map(item => this.mapOrder(item)),
      addresses: addresses.map(item => this.mapAddress(item)),
      designs: designs.map(item => this.mapDesign(item)),
    };
  }

  private async replaceUserState(userId: string, state: UserBusinessState): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userCartItem.deleteMany({ where: { userId } });
      await tx.userFavorite.deleteMany({ where: { userId } });
      await tx.userHistory.deleteMany({ where: { userId } });
      await tx.userOrder.deleteMany({ where: { userId } });
      await tx.userAddress.deleteMany({ where: { userId } });
      await tx.userDiyDesign.deleteMany({ where: { userId } });

      if (state.cartItems.length > 0) {
        await tx.userCartItem.createMany({
          data: state.cartItems.map(item => ({
            id: item.id,
            userId,
            kind: item.kind,
            productId: item.kind === 'product' ? item.productId : null,
            skuId: item.kind === 'product' ? item.skuId : null,
            designId: item.kind === 'design' ? item.designId : null,
            designConfigSignature: item.kind === 'design' ? item.designConfigSignature : null,
            title: item.title,
            coverImageUrl: item.coverImageUrl,
            specLabel: item.specLabel ?? null,
            priceFen: item.priceFen,
            qty: item.qty,
            selected: item.selected,
          })),
        });
      }

      if (state.favoriteProductIds.length > 0) {
        await tx.userFavorite.createMany({
          data: state.favoriteProductIds.map(productId => ({
            userId,
            productId,
          })),
        });
      }

      if (state.history.length > 0) {
        await tx.userHistory.createMany({
          data: state.history.map(item => ({
            userId,
            productId: item.productId,
            viewedAt: toDate(item.viewedAt),
            updatedAt: toDate(item.viewedAt),
          })),
        });
      }

      if (state.orders.length > 0) {
        await tx.userOrder.createMany({
          data: state.orders.map(order => ({
            id: order.id,
            userId,
            orderNo: order.orderNo,
            status: order.status,
            source: order.source,
            items: asJson(order.items),
            goodsTotalFen: order.goodsTotalFen,
            deliveryFeeFen: order.deliveryFeeFen,
            payableTotalFen: order.payableTotalFen,
            itemCount: order.itemCount,
            address: asJson(order.address),
            payMethod: order.payMethod,
            shippingMethod: order.shippingMethod,
            timeline: asJson(order.timeline),
            cancelRequest: order.cancelRequest ? asJson(order.cancelRequest) : Prisma.DbNull,
            createdAt: toDate(order.timeline.createdAt),
            updatedAt: toDate(order.updatedAt),
          })),
        });
      }

      if (state.addresses.length > 0) {
        await tx.userAddress.createMany({
          data: state.addresses.map(address => ({
            id: address.id,
            userId,
            name: address.name,
            dialCode: address.dialCode,
            phone: address.phone,
            isDefault: address.isDefault,
            tag: address.tag,
            tagPreset: address.tagPreset,
            deliveryAddress: address.deliveryAddress,
            buildingDetail: address.buildingDetail,
            detail: address.detail,
            pasteText: address.pasteText,
            createdAt: toDate(address.createdAt),
            updatedAt: toDate(address.updatedAt),
          })),
        });
      }

      if (state.designs.length > 0) {
        await tx.userDiyDesign.createMany({
          data: state.designs.map(design => ({
            id: design.id,
            userId,
            name: design.name,
            wristSize: design.wristSize,
            wearMode: design.wearMode,
            beads: asJson(design.beads),
            configSignature: design.configSignature,
            accessoriesText: design.accessoriesText,
            wearModeText: design.wearModeText,
            specLabel: design.specLabel,
            priceFen: design.priceFen,
            createdAt: toDate(design.createdAt),
            updatedAt: toDate(design.updatedAt),
          })),
        });
      }
    });
  }

  private mapCartItem(
    item: {
      id: string;
      kind: string;
      productId: string | null;
      skuId: string | null;
      designId: string | null;
      designConfigSignature: string | null;
      title: string;
      coverImageUrl: string | null;
      specLabel: string | null;
      priceFen: number;
      qty: number;
      selected: boolean;
    },
  ): CommerceCartItem {
    if (item.kind === 'product') {
      return {
        id: item.id,
        kind: 'product',
        productId: item.productId ?? '',
        skuId: item.skuId ?? '',
        title: item.title,
        coverImageUrl: item.coverImageUrl,
        specLabel: item.specLabel ?? undefined,
        priceFen: item.priceFen,
        qty: item.qty,
        selected: item.selected,
      };
    }

    return {
      id: item.id,
      kind: 'design',
      designId: item.designId ?? '',
      designConfigSignature: item.designConfigSignature ?? '',
      title: item.title,
      coverImageUrl: item.coverImageUrl,
      specLabel: item.specLabel ?? undefined,
      priceFen: item.priceFen,
      qty: item.qty,
      selected: item.selected,
    };
  }

  private mapOrder(
    item: {
      id: string;
      orderNo: string;
      status: string;
      source: string;
      items: Prisma.JsonValue;
      goodsTotalFen: number;
      deliveryFeeFen: number;
      payableTotalFen: number;
      itemCount: number;
      address: Prisma.JsonValue;
      payMethod: string;
      shippingMethod: string;
      timeline: Prisma.JsonValue;
      cancelRequest: Prisma.JsonValue | null;
      updatedAt: Date;
    },
  ): CommerceOrderDetail {
    return {
      id: item.id,
      orderNo: item.orderNo,
      status: item.status as CommerceOrderDetail['status'],
      source: item.source as CommerceOrderDetail['source'],
      items: clone(item.items) as CommerceCartItem[],
      goodsTotalFen: item.goodsTotalFen,
      deliveryFeeFen: item.deliveryFeeFen,
      payableTotalFen: item.payableTotalFen,
      itemCount: item.itemCount,
      address: clone(item.address) as CommerceOrderAddressSnapshot,
      payMethod: item.payMethod as CommerceOrderDetail['payMethod'],
      shippingMethod: item.shippingMethod as CommerceOrderDetail['shippingMethod'],
      timeline: clone(item.timeline) as CommerceOrderTimeline,
      cancelRequest: item.cancelRequest
        ? (clone(item.cancelRequest) as CommerceOrderCancelRequest)
        : undefined,
      updatedAt: toTimestamp(item.updatedAt),
    };
  }

  private mapAddress(
    item: {
      id: string;
      name: string;
      dialCode: string;
      phone: string;
      isDefault: boolean;
      tag: string;
      tagPreset: string;
      deliveryAddress: string;
      buildingDetail: string;
      detail: string;
      pasteText: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): AddressBookItem {
    return {
      id: item.id,
      name: item.name,
      dialCode: item.dialCode,
      phone: item.phone,
      isDefault: item.isDefault,
      tag: item.tag,
      tagPreset: item.tagPreset as AddressBookItem['tagPreset'],
      deliveryAddress: item.deliveryAddress,
      buildingDetail: item.buildingDetail,
      detail: item.detail,
      pasteText: item.pasteText,
      createdAt: toTimestamp(item.createdAt),
      updatedAt: toTimestamp(item.updatedAt),
    };
  }

  private mapDesign(
    item: {
      id: string;
      name: string;
      wristSize: string;
      wearMode: string;
      beads: Prisma.JsonValue;
      configSignature: string;
      accessoriesText: string;
      wearModeText: string;
      specLabel: string;
      priceFen: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ): SavedDiyDesign {
    return {
      id: item.id,
      name: item.name,
      wristSize: item.wristSize,
      wearMode: item.wearMode as SavedDiyDesign['wearMode'],
      beads: clone(item.beads) as SavedDiyDesign['beads'],
      configSignature: item.configSignature,
      accessoriesText: item.accessoriesText,
      wearModeText: item.wearModeText,
      specLabel: item.specLabel,
      priceFen: item.priceFen,
      createdAt: toTimestamp(item.createdAt),
      updatedAt: toTimestamp(item.updatedAt),
    };
  }
}
