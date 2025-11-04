export type HttpMethod = 'GET'|'POST'|'PATCH'|'PUT'|'DELETE'
export interface ClientConfig { baseUrl?: string; headers?: Record<string,string> }
export const createClient = (cfg: ClientConfig = {}) => {
  const base = cfg.baseUrl || ''
  return {
    async request(path: string, init: RequestInit = {}) {
      const res = await fetch(base + path, init)
      if (!res.ok) throw new Error(`[sdk] ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      return ct.includes('application/json') ? res.json() : res.text()
    }
  }
}
