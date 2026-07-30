export function createId(prefix = "") {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}-${id}` : id;
}
