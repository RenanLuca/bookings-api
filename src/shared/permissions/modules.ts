export const PERMISSION_MODULES = ["LOGS", "APPOINTMENTS"] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export function isValidPermissionModule(value: string): value is PermissionModule {
  return PERMISSION_MODULES.includes(value as PermissionModule);
}
