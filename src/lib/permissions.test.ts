import { describe, it, expect } from "vitest";
import { can } from "./permissions";

describe("can (role permission matrix)", () => {
  it("gives ADMIN full access to every checked permission", () => {
    expect(can("ADMIN", "manageUsers")).toBe(true);
    expect(can("ADMIN", "manageFinance")).toBe(true);
    expect(can("ADMIN", "manageTrips")).toBe(true);
    expect(can("ADMIN", "manageMaintenance")).toBe(true);
    expect(can("ADMIN", "viewActivityLog")).toBe(true);
  });

  it("lets OPS_MANAGER manage trips/trucks/drivers but not finance or users", () => {
    expect(can("OPS_MANAGER", "manageTrips")).toBe(true);
    expect(can("OPS_MANAGER", "manageDrivers")).toBe(true);
    expect(can("OPS_MANAGER", "manageFinance")).toBe(false);
    expect(can("OPS_MANAGER", "manageUsers")).toBe(false);
    expect(can("OPS_MANAGER", "manageMaintenance")).toBe(false);
  });

  it("lets ACCOUNTANT manage finance but not trips or maintenance", () => {
    expect(can("ACCOUNTANT", "manageFinance")).toBe(true);
    expect(can("ACCOUNTANT", "viewFinance")).toBe(true);
    expect(can("ACCOUNTANT", "manageTrips")).toBe(false);
    expect(can("ACCOUNTANT", "manageMaintenance")).toBe(false);
  });

  it("lets MAINTENANCE manage maintenance requests but nothing financial or trip-related", () => {
    expect(can("MAINTENANCE", "manageMaintenance")).toBe(true);
    expect(can("MAINTENANCE", "manageTrips")).toBe(false);
    expect(can("MAINTENANCE", "manageFinance")).toBe(false);
    expect(can("MAINTENANCE", "manageUsers")).toBe(false);
  });

  it("denies DRIVER every back-office permission", () => {
    expect(can("DRIVER", "manageTrips")).toBe(false);
    expect(can("DRIVER", "viewTrips")).toBe(false);
    expect(can("DRIVER", "manageFinance")).toBe(false);
    expect(can("DRIVER", "manageUsers")).toBe(false);
    expect(can("DRIVER", "viewDashboard")).toBe(false);
  });

  it("returns false for a null/undefined role", () => {
    expect(can(undefined, "viewDashboard")).toBe(false);
    expect(can(null, "manageTrips")).toBe(false);
  });

  it("only ADMIN can manage users and view the activity log", () => {
    const roles = ["ADMIN", "OPS_MANAGER", "ACCOUNTANT", "MAINTENANCE", "DRIVER"] as const;
    const allowed = roles.filter((r) => can(r, "manageUsers"));
    expect(allowed).toEqual(["ADMIN"]);

    const allowedLog = roles.filter((r) => can(r, "viewActivityLog"));
    expect(allowedLog).toEqual(["ADMIN"]);
  });
});
