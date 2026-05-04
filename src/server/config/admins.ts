export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  
  // Primary check: Environment variable (useful for initial setup/dev)
  const adminEmailsVar = process.env.ADMIN_EMAILS || '';
  const adminEmails = adminEmailsVar.split(',').map(e => e.trim().toLowerCase());
  
  // Hardcoded master admin
  const masterAdmins = ['vinidoctor@gmail.com'];
  
  if (email) {
    const lowerEmail = email.toLowerCase().trim();
    if (adminEmails.includes(lowerEmail) || masterAdmins.includes(lowerEmail)) {
      return true;
    }
  }

  return false;
}
