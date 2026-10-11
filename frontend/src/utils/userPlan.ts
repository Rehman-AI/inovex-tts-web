/**
 * Utility to check user tier and character limits.
 * Unlimited users (VIP / Admin) bypass all character quotas and deduction.
 */

const DEFAULT_UNLIMITED_EMAILS = [
  "imsami67@gmail.com",
  "rehmanspam000@gmail.com",
];

export function isUnlimitedUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // 1. Check default list
  if (DEFAULT_UNLIMITED_EMAILS.includes(normalized)) {
    return true;
  }

  // 2. Check environment variable list (comma-separated)
  const envList = process.env.NEXT_PUBLIC_UNLIMITED_EMAILS;
  if (envList) {
    const list = envList
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (list.includes(normalized)) {
      return true;
    }
  }

  return false;
}
