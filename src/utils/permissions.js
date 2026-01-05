export function hasStaffRole(member, staffRoleName) {
  return member.roles.cache.some(r => r.name === staffRoleName);
}
