/// <reference types="vite/client" />

declare module 'heic-convert/browser' {
  type Format = 'JPEG' | 'PNG';
  const convert: (opts: { buffer: ArrayBufferView | ArrayBuffer; format: Format; quality?: number }) => Promise<Uint8Array>;
  export default convert;
}
