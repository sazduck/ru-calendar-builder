export function err<T>(error: T): { ok: false; error: T } {
  return { ok: false, error };
}

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}
