export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  
  // Primary check: Environment variable (useful for initial setup/dev)
  const adminEmailsVar = process.env.ADMIN_EMAILS || '';
  if (adminEmailsVar) {
    const adminEmails = adminEmailsVar.split(',').map(e => e.trim().toLowerCase());
    if (adminEmails.includes(email.toLowerCase().trim())) {
      return true;
    }
  }

  // Backup/Secondary: Hardcoded fallbacks if no ENV is set (optional, but requested to remove)
  // For security, we should NOT have hardcoded emails here anymore.
  return false;
}
