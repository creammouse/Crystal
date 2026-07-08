export type CommerceCategory = {
  id: string;
  name: string;
  shortName?: string;
  sortOrder: number;
  isVisible: boolean;
  isHomeEntry?: boolean;
  coverImageUrl?: string | null;
};

export type CommerceProductBadge = {
  code: string;
  label: string;
};

export type CommerceProductSku = {
  id: string;
  label: string;
  specValues: string[];
  priceFen: number;
  stock: number;
  isDefault?: boolean;
};

export type CommerceServiceNote = {
  code: string;
  label: string;
  detail: string;
};

export type CommerceDetailSection = {
  id: string;
  title: string;
  content: string;
};

export type CommerceProductDetail = {
  id: string;
  categoryId: string;
  title: string;
  coverImageUrl: string | null;
  priceFen: number;
  badges: CommerceProductBadge[];
  stockStatus: 'in_stock' | 'sold_out' | 'preorder';
  isCustomizable: boolean;
  description: string;
  gallery: Array<{
    id: string;
    imageUrl: string | null;
    alt: string;
  }>;
  specs: string[];
  skus: CommerceProductSku[];
  serviceNotes: CommerceServiceNote[];
  detailSections: CommerceDetailSection[];
  favoriteCount: number;
  isFavorited: boolean;
  canAddToCart: boolean;
  canBuyNow: boolean;
};

export type CommerceCartItem =
  | {
      id: string;
      kind: 'product';
      productId: string;
      skuId: string;
      title: string;
      coverImageUrl: string | null;
      specLabel?: string;
      priceFen: number;
      qty: number;
      selected: boolean;
    }
  | {
      id: string;
      kind: 'design';
      designId: string;
      designConfigSignature: string;
      title: string;
      coverImageUrl: string | null;
      specLabel?: string;
      priceFen: number;
      qty: number;
      selected: boolean;
    };

export type CommerceFavoriteItem = {
  productId: string;
  title: string;
  coverImageUrl: string | null;
  priceFen?: number;
  savedAtLabel: string;
};

export type CommerceHistoryItem = {
  productId: string;
  title: string;
  coverImageUrl: string | null;
  priceFen?: number;
  viewedAtLabel: string;
};

export type CommerceOrderStatus =
  | 'pending_payment'
  | 'pending_receipt'
  | 'completed'
  | 'cancelled';

export type CommerceOrderSource = 'buy_now' | 'cart';
export type CommerceOrderPayMethod = 'wechat_pay';
export type CommerceOrderShippingMethod = 'express';
export type CommerceOrderCancelRequestStatus = 'requested' | 'approved' | 'rejected';

export type CommerceOrderAddressSnapshot = {
  name: string;
  dialCode: string;
  phone: string;
  tag: string;
  detail: string;
};

export type CommerceOrderCancelRequest = {
  status: CommerceOrderCancelRequestStatus;
  requestedAt: number;
  reviewedAt?: number;
  reasonCategory?: string;
  reason?: string;
  reviewerName?: string;
  reviewNote?: string;
};

export type CommerceOrderTimeline = {
  createdAt: number;
  paidAt?: number;
  completedAt?: number;
  cancelledAt?: number;
};

export type CommerceOrderDetail = {
  id: string;
  orderNo: string;
  status: CommerceOrderStatus;
  source: CommerceOrderSource;
  items: CommerceCartItem[];
  goodsTotalFen: number;
  deliveryFeeFen: number;
  payableTotalFen: number;
  itemCount: number;
  address: CommerceOrderAddressSnapshot;
  payMethod: CommerceOrderPayMethod;
  shippingMethod: CommerceOrderShippingMethod;
  timeline: CommerceOrderTimeline;
  cancelRequest?: CommerceOrderCancelRequest;
  updatedAt: number;
};

export type AddressTagPreset = 'home' | 'school' | 'company' | 'custom';

export type AddressBookItem = {
  id: string;
  name: string;
  dialCode: string;
  phone: string;
  isDefault: boolean;
  tag: string;
  tagPreset: AddressTagPreset;
  deliveryAddress: string;
  buildingDetail: string;
  detail: string;
  pasteText: string;
  createdAt: number;
  updatedAt: number;
};

export type DiyWearMode = 'single' | 'double';

export type DiyBraceletBead = {
  goodsId: string;
  name: string;
  size: number;
  sizes: number[];
};

export type SavedDiyDesign = {
  id: string;
  name: string;
  wristSize: string;
  wearMode: DiyWearMode;
  beads: DiyBraceletBead[];
  configSignature: string;
  accessoriesText: string;
  wearModeText: string;
  specLabel: string;
  priceFen: number;
  createdAt: number;
  updatedAt: number;
};

export type UserBusinessState = {
  cartItems: CommerceCartItem[];
  favoriteProductIds: string[];
  history: Array<{ productId: string; viewedAt: number }>;
  orders: CommerceOrderDetail[];
  addresses: AddressBookItem[];
  designs: SavedDiyDesign[];
};

export type BusinessState = {
  users: Record<string, UserBusinessState>;
};
