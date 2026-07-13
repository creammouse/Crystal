import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import type {
  AddressBookItem,
  BusinessState,
  CommerceCartItem,
  CommerceOrderDetail,
  SavedDiyDesign,
  UserBusinessState,
} from '../src/business/business.types';

type CliOptions = {
  filePath: string;
  force: boolean;
  dryRun: boolean;
  userId?: string;
};

type PersistedStateCounts = {
  cartItems: number;
  favorites: number;
  history: number;
  orders: number;
  addresses: number;
  designs: number;
};

const EMPTY_USER_STATE: UserBusinessState = {
  cartItems: [],
  favoriteProductIds: [],
  history: [],
  orders: [],
  addresses: [],
  designs: [],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toDate(value: number): Date {
  return new Date(value);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    filePath: resolve(process.cwd(), 'data', 'business-state.json'),
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    if (arg === '--force') {
      options.force = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--file' && argv[index + 1]) {
      options.filePath = resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg.startsWith('--file=')) {
      options.filePath = resolve(arg.slice('--file='.length));
      continue;
    }
    if (arg === '--user' && argv[index + 1]) {
      options.userId = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--user=')) {
      options.userId = arg.slice('--user='.length);
    }
  }

  return options;
}

function normalizeUserState(input: Partial<UserBusinessState> | undefined): UserBusinessState {
  const cartById = new Map<string, CommerceCartItem>();
  for (const item of Array.isArray(input?.cartItems) ? input.cartItems : []) {
    if (item?.id) {
      cartById.set(item.id, clone(item));
    }
  }

  const favoriteIds = Array.from(
    new Set((Array.isArray(input?.favoriteProductIds) ? input.favoriteProductIds : []).filter(Boolean)),
  );

  const historyByProductId = new Map<string, { productId: string; viewedAt: number }>();
  for (const entry of Array.isArray(input?.history) ? input.history : []) {
    if (!entry?.productId || historyByProductId.has(entry.productId)) {
      continue;
    }
    historyByProductId.set(entry.productId, {
      productId: entry.productId,
      viewedAt: Number(entry.viewedAt ?? 0),
    });
  }

  const ordersById = new Map<string, CommerceOrderDetail>();
  for (const order of Array.isArray(input?.orders) ? input.orders : []) {
    if (order?.id) {
      ordersById.set(order.id, clone(order));
    }
  }

  const addressesById = new Map<string, AddressBookItem>();
  for (const address of Array.isArray(input?.addresses) ? input.addresses : []) {
    if (address?.id) {
      addressesById.set(address.id, clone(address));
    }
  }

  const designsById = new Map<string, SavedDiyDesign>();
  for (const design of Array.isArray(input?.designs) ? input.designs : []) {
    if (design?.id) {
      designsById.set(design.id, clone(design));
    }
  }

  return {
    cartItems: Array.from(cartById.values()),
    favoriteProductIds: favoriteIds,
    history: Array.from(historyByProductId.values()),
    orders: Array.from(ordersById.values()),
    addresses: Array.from(addressesById.values()),
    designs: Array.from(designsById.values()),
  };
}

async function readPersistedStateCounts(prisma: PrismaClient, userId: string): Promise<PersistedStateCounts> {
  const [cartItems, favorites, history, orders, addresses, designs] = await prisma.$transaction([
    prisma.userCartItem.count({ where: { userId } }),
    prisma.userFavorite.count({ where: { userId } }),
    prisma.userHistory.count({ where: { userId } }),
    prisma.userOrder.count({ where: { userId } }),
    prisma.userAddress.count({ where: { userId } }),
    prisma.userDiyDesign.count({ where: { userId } }),
  ]);

  return { cartItems, favorites, history, orders, addresses, designs };
}

function hasPersistedState(counts: PersistedStateCounts) {
  return Object.values(counts).some(value => value > 0);
}

async function replaceUserState(
  prisma: PrismaClient,
  userId: string,
  state: UserBusinessState,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(options.filePath)) {
    console.log(`no legacy file found at ${options.filePath}, nothing to migrate`);
    return;
  }

  const raw = readFileSync(options.filePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<BusinessState>;
  const allUsers = parsed.users ?? {};
  const targetEntries = Object.entries(allUsers).filter(([userId]) =>
    options.userId ? userId === options.userId : true,
  );

  if (targetEntries.length === 0) {
    console.log('no legacy users matched');
    return;
  }

  const prisma = new PrismaClient();
  const summary = {
    migrated: 0,
    skippedExisting: 0,
    skippedMissingUser: 0,
    examined: targetEntries.length,
  };

  try {
    for (const [userId, bucket] of targetEntries) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, phone: true },
      });
      if (!user) {
        summary.skippedMissingUser += 1;
        console.warn(`[skip:missing-user] ${userId}`);
        continue;
      }

      const normalizedState = normalizeUserState(bucket ?? EMPTY_USER_STATE);
      const existingCounts = await readPersistedStateCounts(prisma, userId);
      if (!options.force && hasPersistedState(existingCounts)) {
        summary.skippedExisting += 1;
        console.warn(
          `[skip:existing-state] ${userId} cart=${existingCounts.cartItems} favorites=${existingCounts.favorites} history=${existingCounts.history} orders=${existingCounts.orders} addresses=${existingCounts.addresses} designs=${existingCounts.designs}`,
        );
        continue;
      }

      if (options.dryRun) {
        console.log(
          `[dry-run] ${userId} cart=${normalizedState.cartItems.length} favorites=${normalizedState.favoriteProductIds.length} history=${normalizedState.history.length} orders=${normalizedState.orders.length} addresses=${normalizedState.addresses.length} designs=${normalizedState.designs.length}`,
        );
        summary.migrated += 1;
        continue;
      }

      await replaceUserState(prisma, userId, normalizedState);
      summary.migrated += 1;
      console.log(
        `[migrated] ${userId} cart=${normalizedState.cartItems.length} favorites=${normalizedState.favoriteProductIds.length} history=${normalizedState.history.length} orders=${normalizedState.orders.length} addresses=${normalizedState.addresses.length} designs=${normalizedState.designs.length}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('');
  console.log(
    `done examined=${summary.examined} migrated=${summary.migrated} skippedExisting=${summary.skippedExisting} skippedMissingUser=${summary.skippedMissingUser}`,
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
