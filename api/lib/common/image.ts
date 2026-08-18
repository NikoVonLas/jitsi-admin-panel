function startsWith(data: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => data[index] === byte);
}

export function hasImageSignature(data: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return startsWith(data, [0xff, 0xd8, 0xff]);
  }
  if (mimeType === "image/png") {
    return startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === "image/gif") {
    return startsWith(data, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
      startsWith(data, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  }
  if (mimeType === "image/webp") {
    return startsWith(data, [0x52, 0x49, 0x46, 0x46]) &&
      data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 &&
      data[11] === 0x50;
  }
  return false;
}
