export const ADMIN_EMAILS = [
  'vinidoctor@gmail.com',
  'vinisilva02@hotmail.com',
  'nangelicaalcantara@gmail.com'
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
