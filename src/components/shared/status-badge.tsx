import { Badge } from "@/components/ui/badge";
import {
  TRUCK_STATUS_LABELS,
  TRUCK_STATUS_VARIANTS,
  DRIVER_STATUS_LABELS,
  DRIVER_STATUS_VARIANTS,
  TRIP_STATUS_LABELS,
  TRIP_STATUS_VARIANTS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_VARIANTS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_VARIANTS,
  ALERT_SEVERITY_LABELS,
  ALERT_SEVERITY_VARIANTS,
} from "@/lib/status-labels";
import type {
  TruckStatus,
  DriverStatus,
  TripStatus,
  MaintenanceStatus,
  MaintenancePriority,
  AlertSeverity,
} from "@/generated/prisma/client";

export function TruckStatusBadge({ status }: { status: TruckStatus }) {
  return <Badge variant={TRUCK_STATUS_VARIANTS[status]}>{TRUCK_STATUS_LABELS[status]}</Badge>;
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return <Badge variant={DRIVER_STATUS_VARIANTS[status]}>{DRIVER_STATUS_LABELS[status]}</Badge>;
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return <Badge variant={TRIP_STATUS_VARIANTS[status]}>{TRIP_STATUS_LABELS[status]}</Badge>;
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <Badge variant={MAINTENANCE_STATUS_VARIANTS[status]}>{MAINTENANCE_STATUS_LABELS[status]}</Badge>
  );
}

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
  return (
    <Badge variant={MAINTENANCE_PRIORITY_VARIANTS[priority]}>
      {MAINTENANCE_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <Badge variant={ALERT_SEVERITY_VARIANTS[severity]}>{ALERT_SEVERITY_LABELS[severity]}</Badge>;
}

export function DelayedBadge() {
  return <Badge variant="destructive">متأخرة</Badge>;
}
