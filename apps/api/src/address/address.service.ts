import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessStoreService } from '../business/business-store.service';
import type { AddressBookItem, AddressTagPreset } from '../business/business.types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizePhone(phone: string) {
  return phone.replace(/\s/g, '');
}

function buildDetail(deliveryAddress: string, buildingDetail: string) {
  return [deliveryAddress.trim(), buildingDetail.trim()].filter(Boolean).join(' ').trim();
}

function getTagLabel(tagPreset: AddressTagPreset, customTag?: string) {
  if (tagPreset === 'custom') return (customTag ?? '').trim();
  if (tagPreset === 'home') return '家';
  if (tagPreset === 'school') return '学校';
  return '公司';
}

@Injectable()
export class AddressService {
  constructor(private readonly store: BusinessStoreService) {}

  listAddresses(userId: string) {
    const userState = this.store.getUserState(userId);
    return { items: clone(this.sortAddresses(userState.addresses)) };
  }

  getAddress(userId: string, id: string) {
    const userState = this.store.getUserState(userId);
    const item = userState.addresses.find(entry => entry.id === id);
    if (!item) throw new NotFoundException('地址不存在');
    return clone(item);
  }

  getDefaultAddress(userId: string) {
    const userState = this.store.getUserState(userId);
    const item = this.sortAddresses(userState.addresses).find(entry => entry.isDefault) ?? null;
    return item ? clone(item) : null;
  }

  saveAddress(
    userId: string,
    payload: {
      id?: string;
      name?: string;
      dialCode?: string;
      phone?: string;
      isDefault?: boolean;
      tagPreset?: AddressTagPreset;
      customTag?: string;
      deliveryAddress?: string;
      buildingDetail?: string;
      pasteText?: string;
    },
  ) {
    const now = Date.now();
    const name = (payload.name ?? '').trim();
    const phone = normalizePhone(payload.phone ?? '');
    const deliveryAddress = (payload.deliveryAddress ?? '').trim();
    const buildingDetail = (payload.buildingDetail ?? '').trim();
    const tagPreset = payload.tagPreset ?? 'home';
    const detail = buildDetail(deliveryAddress, buildingDetail);
    if (!name || !phone || !detail) {
      throw new BadRequestException('地址信息不完整');
    }

    return this.store.updateUserState(userId, (userState) => {
      const existing = payload.id
        ? userState.addresses.find(item => item.id === payload.id)
        : null;
      const next: AddressBookItem = {
        id:
          existing?.id
          ?? (payload.id?.trim() || `addr-${now}-${Math.random().toString(36).slice(2, 8)}`),
        name,
        dialCode: (payload.dialCode ?? '+86').trim() || '+86',
        phone,
        isDefault: Boolean(payload.isDefault) || userState.addresses.length === 0,
        tag: getTagLabel(tagPreset, payload.customTag),
        tagPreset,
        deliveryAddress,
        buildingDetail,
        detail,
        pasteText: (payload.pasteText ?? '').trim(),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      userState.addresses = existing
        ? userState.addresses.map(item => (item.id === existing.id ? next : item))
        : [next, ...userState.addresses];

      if (next.isDefault) {
        userState.addresses = userState.addresses.map(item => ({
          ...item,
          isDefault: item.id === next.id,
        }));
      } else {
        userState.addresses = this.ensureDefault(userState.addresses);
      }

      return clone(next);
    });
  }

  deleteAddress(userId: string, id: string) {
    return this.store.updateUserState(userId, (userState) => {
      userState.addresses = this.ensureDefault(
        userState.addresses.filter(item => item.id !== id),
      );
      return { items: clone(this.sortAddresses(userState.addresses)) };
    });
  }

  setDefault(userId: string, id: string) {
    return this.store.updateUserState(userId, (userState) => {
      const exists = userState.addresses.some(item => item.id === id);
      if (!exists) throw new NotFoundException('地址不存在');
      userState.addresses = userState.addresses.map(item => ({
        ...item,
        isDefault: item.id === id,
        updatedAt: item.id === id ? Date.now() : item.updatedAt,
      }));
      return clone(userState.addresses.find(item => item.id === id)!);
    });
  }

  private sortAddresses(list: AddressBookItem[]) {
    return [...list].sort((left, right) => {
      if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
      return right.updatedAt - left.updatedAt;
    });
  }

  private ensureDefault(list: AddressBookItem[]) {
    if (!list.length) return [];
    let assigned = false;
    return this.sortAddresses(list).map((item, index) => {
      if (!assigned && (item.isDefault || index === 0)) {
        assigned = true;
        return { ...item, isDefault: true };
      }
      return { ...item, isDefault: false };
    });
  }
}
