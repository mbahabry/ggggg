-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPS_MANAGER', 'ACCOUNTANT', 'MAINTENANCE', 'DRIVER');

-- CreateEnum
CREATE TYPE "TruckStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'STOPPED');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'LEAVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'TO_PICKUP', 'LOADED', 'TO_DROPOFF', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('NEW', 'INSPECTING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinanceCategory" AS ENUM ('TRIP_REVENUE', 'FUEL', 'MAINTENANCE', 'DRIVER_PAYROLL', 'FINES', 'ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DRIVER_LICENSE_EXPIRY', 'TRUCK_FORM_EXPIRY', 'TRUCK_INSURANCE_EXPIRY', 'TRUCK_INSPECTION_EXPIRY', 'TRIP_DELAYED', 'TRUCK_MAINTENANCE_NEEDED', 'INVOICE_DUE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "internalNumber" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "truckType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "capacityTons" DECIMAL(10,2) NOT NULL,
    "chassisNumber" TEXT NOT NULL,
    "odometerKm" INTEGER NOT NULL DEFAULT 0,
    "status" "TruckStatus" NOT NULL DEFAULT 'AVAILABLE',
    "formExpiry" TIMESTAMP(3) NOT NULL,
    "insuranceExpiry" TIMESTAMP(3) NOT NULL,
    "inspectionExpiry" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3) NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.0,
    "violationsCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "truckId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commercialRegister" TEXT,
    "taxNumber" TEXT,
    "contactName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "tripNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originAddress" TEXT,
    "destinationCity" TEXT NOT NULL,
    "destinationAddress" TEXT,
    "pickupDateTime" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3) NOT NULL,
    "cargoType" TEXT NOT NULL,
    "cargoWeightTons" DECIMAL(10,2) NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "driverId" TEXT,
    "truckId" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "proofOfDeliveryUrl" TEXT,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStatusHistory" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromStatus" "TripStatus",
    "toStatus" "TripStatus" NOT NULL,
    "changedById" TEXT,
    "changedByDriverId" TEXT,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "faultType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedByDriverId" TEXT,
    "serviceCenter" TEXT,
    "cost" DECIMAL(12,2),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'NEW',
    "nextMaintenanceDate" TIMESTAMP(3),
    "odometerAtService" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "category" "FinanceCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "truckId" TEXT,
    "driverId" TEXT,
    "tripId" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "dueDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedTruckId" TEXT,
    "relatedDriverId" TEXT,
    "relatedTripId" TEXT,
    "relatedFinanceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_internalNumber_key" ON "Truck"("internalNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_plateNumber_key" ON "Truck"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_chassisNumber_key" ON "Truck"("chassisNumber");

-- CreateIndex
CREATE INDEX "Truck_status_idx" ON "Truck"("status");

-- CreateIndex
CREATE INDEX "Truck_formExpiry_idx" ON "Truck"("formExpiry");

-- CreateIndex
CREATE INDEX "Truck_insuranceExpiry_idx" ON "Truck"("insuranceExpiry");

-- CreateIndex
CREATE INDEX "Truck_inspectionExpiry_idx" ON "Truck"("inspectionExpiry");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_nationalId_key" ON "Driver"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_truckId_key" ON "Driver"("truckId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Driver_licenseExpiry_idx" ON "Driver"("licenseExpiry");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_tripNumber_key" ON "Trip"("tripNumber");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "Trip_driverId_idx" ON "Trip"("driverId");

-- CreateIndex
CREATE INDEX "Trip_truckId_idx" ON "Trip"("truckId");

-- CreateIndex
CREATE INDEX "Trip_customerId_idx" ON "Trip"("customerId");

-- CreateIndex
CREATE INDEX "Trip_pickupDateTime_idx" ON "Trip"("pickupDateTime");

-- CreateIndex
CREATE INDEX "Trip_expectedDeliveryDate_idx" ON "Trip"("expectedDeliveryDate");

-- CreateIndex
CREATE INDEX "TripStatusHistory_tripId_idx" ON "TripStatusHistory"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRequest_requestNumber_key" ON "MaintenanceRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_truckId_idx" ON "MaintenanceRequest"("truckId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_reportedAt_idx" ON "MaintenanceRequest"("reportedAt");

-- CreateIndex
CREATE INDEX "FinanceTransaction_type_idx" ON "FinanceTransaction"("type");

-- CreateIndex
CREATE INDEX "FinanceTransaction_category_idx" ON "FinanceTransaction"("category");

-- CreateIndex
CREATE INDEX "FinanceTransaction_date_idx" ON "FinanceTransaction"("date");

-- CreateIndex
CREATE INDEX "FinanceTransaction_isPaid_idx" ON "FinanceTransaction"("isPaid");

-- CreateIndex
CREATE INDEX "FinanceTransaction_customerId_idx" ON "FinanceTransaction"("customerId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_truckId_idx" ON "FinanceTransaction"("truckId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_driverId_idx" ON "FinanceTransaction"("driverId");

-- CreateIndex
CREATE INDEX "Alert_isResolved_idx" ON "Alert"("isResolved");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_changedByDriverId_fkey" FOREIGN KEY ("changedByDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_reportedByDriverId_fkey" FOREIGN KEY ("reportedByDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
