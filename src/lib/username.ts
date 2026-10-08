// Netlify Identity accounts are keyed by email. To let admins hand out simple
// usernames ("ahmed", "branch12"), a username without "@" is stored as
// `<username>@users.ravin.app`. Real emails are kept as-is.
export const USERNAME_DOMAIN = 'users.ravin.app'

export function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase()
  return v.includes('@') ? v : `${v}@${USERNAME_DOMAIN}`
}

export function displayUsername(email: string): string {
  const suffix = `@${USERNAME_DOMAIN}`
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email
}
