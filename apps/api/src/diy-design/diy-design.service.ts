import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessStoreService } from '../business/business-store.service';
import type { SavedDiyDesign } from '../business/business.types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

@Injectable()
export class DiyDesignService {
  constructor(private readonly store: BusinessStoreService) {}

  async list(userId: string) {
    const userState = await this.store.getUserState(userId);
    return {
      items: clone([...userState.designs].sort((left, right) => right.updatedAt - left.updatedAt)),
    };
  }

  async getOne(userId: string, id: string) {
    const userState = await this.store.getUserState(userId);
    const item = userState.designs.find(entry => entry.id === id);
    if (!item) throw new NotFoundException('设计不存在');
    return clone(item);
  }

  async save(userId: string, payload: Partial<SavedDiyDesign>) {
    const name = (payload.name ?? '').trim();
    if (!name || !Array.isArray(payload.beads) || payload.beads.length === 0) {
      throw new BadRequestException('设计信息不完整');
    }
    const beads = clone(payload.beads);
    return await this.store.updateUserState(userId, (userState) => {
      const now = Date.now();
      const existing = payload.id
        ? userState.designs.find(item => item.id === payload.id)
        : null;
      const next: SavedDiyDesign = {
        id:
          existing?.id
          ?? (payload.id?.trim() || `design-${now}-${Math.random().toString(36).slice(2, 8)}`),
        name,
        wristSize: (payload.wristSize ?? '16').trim() || '16',
        wearMode: payload.wearMode === 'double' ? 'double' : 'single',
        beads,
        configSignature: (payload.configSignature ?? '').trim(),
        accessoriesText: (payload.accessoriesText ?? '').trim(),
        wearModeText: (payload.wearModeText ?? '').trim(),
        specLabel: (payload.specLabel ?? '').trim(),
        priceFen: Number(payload.priceFen ?? 0),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      userState.designs = existing
        ? userState.designs.map(item => (item.id === existing.id ? next : item))
        : [next, ...userState.designs];
      return clone(next);
    });
  }

  async delete(userId: string, id: string) {
    return await this.store.updateUserState(userId, (userState) => {
      userState.designs = userState.designs.filter(item => item.id !== id);
      return { items: clone(userState.designs) };
    });
  }
}
