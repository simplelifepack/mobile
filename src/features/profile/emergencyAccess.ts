import type { TrustAccess, TrustPermission } from '../../api/trust.api';

export const accessDescriptions: Record<TrustAccess, string> = {
  FAMILY_MEMBER: 'Documents: view and download. Health: view. Wealth: view and download.',
  EMERGENCY_ACCESS: 'Documents: view. Health: no access. Wealth: view and download.',
  VIEW_ONLY: 'Documents: view. Health and wealth: no access.',
};

export function permissionsForAccess(access: TrustAccess): TrustPermission[] {
  const full = access === 'FAMILY_MEMBER';
  const emergency = access === 'EMERGENCY_ACCESS';
  return [
    { module: 'DOCUMENTS', canView: true, canDownload: full },
    { module: 'HEALTH', canView: full, canDownload: false },
    { module: 'WEALTH', canView: full || emergency, canDownload: full || emergency },
  ];
}

export function describePermissions(permissions: TrustPermission[]): string {
  return (['DOCUMENTS', 'HEALTH', 'WEALTH'] as const).map(module => {
    const permission = permissions.find(item => item.module === module);
    const access = permission?.canView
      ? permission.canDownload ? 'view and download' : 'view'
      : 'no access';
    const label = module.charAt(0) + module.slice(1).toLowerCase();
    return `${label}: ${access}`;
  }).join('. ') + '.';
}
