import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { BusinessState, UserBusinessState } from './business.types';

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

@Injectable()
export class BusinessStoreService {
  private readonly dataDir = join(process.cwd(), 'data');
  private readonly filePath = join(this.dataDir, 'business-state.json');

  constructor() {
    this.ensureStoreFile();
  }

  readState(): BusinessState {
    this.ensureStoreFile();
    try {
      const raw = readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<BusinessState>;
      return {
        users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      };
    } catch {
      return { users: {} };
    }
  }

  writeState(state: BusinessState) {
    this.ensureStoreFile();
    writeFileSync(this.filePath, JSON.stringify(state, null, 2), 'utf8');
  }

  getUserState(userId: string): UserBusinessState {
    const state = this.readState();
    const bucket = state.users[userId];
    if (!bucket) {
      state.users[userId] = clone(EMPTY_USER_STATE);
      this.writeState(state);
      return clone(state.users[userId]);
    }
    return {
      cartItems: Array.isArray(bucket.cartItems) ? clone(bucket.cartItems) : [],
      favoriteProductIds: Array.isArray(bucket.favoriteProductIds)
        ? clone(bucket.favoriteProductIds)
        : [],
      history: Array.isArray(bucket.history) ? clone(bucket.history) : [],
      orders: Array.isArray(bucket.orders) ? clone(bucket.orders) : [],
      addresses: Array.isArray(bucket.addresses) ? clone(bucket.addresses) : [],
      designs: Array.isArray(bucket.designs) ? clone(bucket.designs) : [],
    };
  }

  updateUserState<T>(userId: string, updater: (current: UserBusinessState) => T): T {
    const state = this.readState();
    const current = state.users[userId]
      ? this.getUserState(userId)
      : clone(EMPTY_USER_STATE);
    const result = updater(current);
    state.users[userId] = current;
    this.writeState(state);
    return result;
  }

  private ensureStoreFile() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
    if (!existsSync(this.filePath)) {
      writeFileSync(this.filePath, JSON.stringify({ users: {} }, null, 2), 'utf8');
    }
  }
}
