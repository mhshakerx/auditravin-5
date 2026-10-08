// Validates the JSON body sent by the audit tool when saving a visit.
export function visitFields(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (!b.data || typeof b.data !== 'object') return null
  const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 300) : '')
  const score = Math.round(Number(b.score))
  return {
    branch: str(b.branch),
    branchCode: str(b.branchCode),
    visitDate: str(b.date),
    auditor: str(b.auditor),
    score: Number.isFinite(score) ? score : 0,
    data: b.data as Record<string, unknown>,
  }
}
