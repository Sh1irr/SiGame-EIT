// Express 5 types route params as `string | string[]` (repeated named params
// can capture arrays); our routes only ever use single-value params.
export function paramAsString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
