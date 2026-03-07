export const USER_ORGANIZATION_PATTERNS = {
  CREATE_USER_ORGANIZATION: 'userOrganization.create',
  USER_AUTHZ_REFRESH: 'userOrganization.user_authz_refresh',
  FIND_ALL_ORGANIZATIONS_BY_USER: 'userOrganization.findAllOrganizationsByUser',
  FIND_ALL_USER_ORGANIZATION: 'userOrganization.findAllUsersByOrganization',
  UPDATE_USER_ORGANIZATION: 'userOrganization.update',
  DELETE_USER_ORGANIZATION: 'userOrganization.delete',
  RESTORE_USER_ORGANIZATION: 'userOrganization.restore'
} as const;
