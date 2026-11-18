-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "IngestMode" AS ENUM ('manual', 'webhook', 'api');

-- CreateEnum
CREATE TYPE "RetailerPlan" AS ENUM ('pilot', 'pizza', 'aggregator');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('dispatched', 'in_transit', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "SourceAdapter" AS ENUM ('manual', 'neighbor', 'webhook', 'square', 'toast', 'clover', 'doordash');

-- CreateEnum
CREATE TYPE "RetailerUserRole" AS ENUM ('owner', 'staff');

-- CreateEnum
CREATE TYPE "WaitlistType" AS ENUM ('retailer', 'consumer');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Retailer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" geography(Point,4326),
    "webhookSecret" TEXT NOT NULL,
    "ingestMode" "IngestMode" NOT NULL DEFAULT 'manual',
    "plan" "RetailerPlan" NOT NULL DEFAULT 'pilot',
    "phone" TEXT,
    "orderUrl" TEXT,
    "category" TEXT,
    "listed" BOOLEAN NOT NULL DEFAULT true,
    "sameRunPerk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Retailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailerUser" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RetailerUserRole" NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "driverId" TEXT,
    "originLocation" geography(Point,4326),
    "destLocation" geography(Point,4326),
    "destAddress" TEXT,
    "dispatchedAt" TIMESTAMP(3) NOT NULL,
    "etaMinutes" INTEGER,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'dispatched',
    "sourceAdapter" "SourceAdapter" NOT NULL,
    "externalId" TEXT,
    "piggybackWindowMinutes" INTEGER NOT NULL DEFAULT 10,
    "rawPayload" JSONB,
    "postedById" TEXT,
    "areaLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeLocation" geography(Point,4326),
    "currentLocation" geography(Point,4326),
    "radiusMeters" INTEGER NOT NULL DEFAULT 600,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "quietStartHour" INTEGER NOT NULL DEFAULT 22,
    "quietEndHour" INTEGER NOT NULL DEFAULT 9,
    "timeZone" TEXT NOT NULL DEFAULT 'America/New_York',
    "maxPerDay" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "orderPlaced" BOOLEAN NOT NULL DEFAULT false,
    "orderedAt" TIMESTAMP(3),
    "sameRun" BOOLEAN,
    "feeWaived" BOOLEAN,
    "distanceMeters" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistLead" (
    "id" TEXT NOT NULL,
    "type" "WaitlistType" NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "business" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "posSystem" TEXT,
    "weeklyVolume" TEXT,
    "source" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_webhookSecret_key" ON "Retailer"("webhookSecret");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerUser_userId_key" ON "RetailerUser"("userId");

-- CreateIndex
CREATE INDEX "RetailerUser_retailerId_idx" ON "RetailerUser"("retailerId");

-- CreateIndex
CREATE INDEX "Driver_retailerId_idx" ON "Driver"("retailerId");

-- CreateIndex
CREATE INDEX "Delivery_status_dispatchedAt_idx" ON "Delivery"("status", "dispatchedAt");

-- CreateIndex
CREATE INDEX "Delivery_postedById_createdAt_idx" ON "Delivery"("postedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_retailerId_sourceAdapter_externalId_key" ON "Delivery"("retailerId", "sourceAdapter", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_userId_key" ON "Subscriber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_subscriberId_idx" ON "PushSubscription"("subscriberId");

-- CreateIndex
CREATE INDEX "Notification_subscriberId_idx" ON "Notification"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_deliveryId_subscriberId_key" ON "Notification"("deliveryId", "subscriberId");

-- CreateIndex
CREATE INDEX "WaitlistLead_type_createdAt_idx" ON "WaitlistLead"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerUser" ADD CONSTRAINT "RetailerUser_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerUser" ADD CONSTRAINT "RetailerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "Retailer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "Subscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

