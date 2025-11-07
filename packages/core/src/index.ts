export type Scalar = 'string'|'number'|'boolean'|'date'|'enum'|'json'
export interface FieldMeta { name:string; type:Scalar|string; isList?:boolean; isNullable?:boolean; readonly?:boolean }
export interface ModelMeta { name:string; fields:FieldMeta[] }
export interface Normalized { models: ModelMeta[] }
export interface StubDMMF { models: { name: string; fields: FieldMeta[] }[] }
export const normalize = (dmmf: StubDMMF | unknown): Normalized => {
  const list = (dmmf as { models?: unknown[] })?.models
  if (!Array.isArray(list)) return { models: [{ name: 'User', fields: [{name:'id', type:'number'},{name:'name', type:'string'}] }] }
  return { models: list.map((m: unknown) => ({ 
    name: (m as {name?: string}).name || '', 
    fields: ((m as {fields?: unknown[]}).fields ?? []) as FieldMeta[] 
  })) }
}
export const pascal = (s:string) => s.replace(/(^|[_-])(\w)/g, (_match:string, _prefix:string, c:string)=>c.toUpperCase())
export const camel = (s:string) => s.replace(/[-_](\w)/g, (_match:string, c:string)=>c.toUpperCase()).replace(/^(\w)/, (m:string)=>m.toLowerCase())
