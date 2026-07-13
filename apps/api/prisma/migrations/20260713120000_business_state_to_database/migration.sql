-- CreateTable
CREATE TABLE "UserCartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "productId" TEXT,
    "skuId" TEXT,
    "designId" TEXT,
    "designConfigSignature" TEXT,
    "title" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "specLabel" TEXT,
    "priceFen" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "selected" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "goodsTotalFen" INTEGER NOT NULL,
    "deliveryFeeFen" INTEGER NOT NULL,
    "payableTotalFen" INTEGER NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "address" JSONB NOT NULL,
    "payMethod" TEXT NOT NULL,
    "shippingMethod" TEXT NOT NULL,
    "timeline" JSONB NOT NULL,
    "cancelRequest" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dialCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "tag" TEXT NOT NULL,
    "tagPreset" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "buildingDetail" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "pasteText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiyDesign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wristSize" TEXT NOT NULL,
    "wearMode" TEXT NOT NULL,
    "beads" JSONB NOT NULL,
    "configSignature" TEXT NOT NULL,
    "accessoriesText" TEXT NOT NULL,
    "wearModeText" TEXT NOT NULL,
    "specLabel" TEXT NOT NULL,
    "priceFen" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDiyDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCartItem_userId_idx" ON "UserCartItem"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_productId_key" ON "UserFavorite"("userId", "productId");

-- CreateIndex
CREATE INDEX "UserHistory_userId_idx" ON "UserHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHistory_userId_productId_key" ON "UserHistory"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrder_orderNo_key" ON "UserOrder"("orderNo");

-- CreateIndex
CREATE INDEX "UserOrder_userId_idx" ON "UserOrder"("userId");

-- CreateIndex
CREATE INDEX "UserAddress_userId_idx" ON "UserAddress"("userId");

-- CreateIndex
CREATE INDEX "UserDiyDesign_userId_idx" ON "UserDiyDesign"("userId");

-- AddForeignKey
ALTER TABLE "UserCartItem" ADD CONSTRAINT "UserCartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHistory" ADD CONSTRAINT "UserHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrder" ADD CONSTRAINT "UserOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiyDesign" ADD CONSTRAINT "UserDiyDesign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
