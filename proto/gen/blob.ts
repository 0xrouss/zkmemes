export class Blob {
  private namespaceId: Uint8Array;
  private data: Uint8Array;
  private shareVersion: number;
  private namespaceVersion: number;

  constructor(data?: {
    namespaceId?: Uint8Array;
    data?: Uint8Array;
    shareVersion?: number;
    namespaceVersion?: number;
  }) {
    this.namespaceId = data?.namespaceId || new Uint8Array();
    this.data = data?.data || new Uint8Array();
    this.shareVersion = data?.shareVersion || 0;
    this.namespaceVersion = data?.namespaceVersion || 0;
  }

  // Getters
  getNamespaceId(): Uint8Array {
    return this.namespaceId;
  }

  getData(): Uint8Array {
    return this.data;
  }

  getShareVersion(): number {
    return this.shareVersion;
  }

  getNamespaceVersion(): number {
    return this.namespaceVersion;
  }

  // Setters
  setNamespaceId(value: Uint8Array): Blob {
    this.namespaceId = value;
    return this;
  }

  setData(value: Uint8Array): Blob {
    this.data = value;
    return this;
  }

  setShareVersion(value: number): Blob {
    this.shareVersion = value;
    return this;
  }

  setNamespaceVersion(value: number): Blob {
    this.namespaceVersion = value;
    return this;
  }

  // Serialization methods
  toObject(): {
    namespaceId: string;
    data: string;
    shareVersion: number;
    namespaceVersion: number;
  } {
    return {
      namespaceId: this.bytesToBase64(this.namespaceId),
      data: this.bytesToBase64(this.data),
      shareVersion: this.shareVersion,
      namespaceVersion: this.namespaceVersion,
    };
  }

  serializeBinary(): Uint8Array {
    // Protobuf wire format:
    // For bytes fields (1 and 2): tag byte + length + content
    // For uint32 fields (3 and 4): tag byte + varint encoded value

    const writeVarint = (value: number): number[] => {
      const bytes: number[] = [];
      while (value > 0x7f) {
        bytes.push((value & 0x7f) | 0x80);
        value >>>= 7;
      }
      bytes.push(value & 0x7f);
      return bytes;
    };

    const varintSize = (value: number): number => {
      let size = 0;
      while (value > 0) {
        size++;
        value >>>= 7;
      }
      return size || 1;
    };

    // Calculate the total size needed
    let size = 0;

    // Field 1: namespace_id (bytes)
    if (this.namespaceId.length > 0) {
      size += 1; // tag byte
      size += varintSize(this.namespaceId.length);
      size += this.namespaceId.length;
    }

    // Field 2: data (bytes)
    if (this.data.length > 0) {
      size += 1; // tag byte
      size += varintSize(this.data.length);
      size += this.data.length;
    }

    // Field 3: share_version (uint32)
    if (this.shareVersion !== 0) {
      size += 1; // tag byte
      size += varintSize(this.shareVersion);
    }

    // Field 4: namespace_version (uint32)
    if (this.namespaceVersion !== 0) {
      size += 1; // tag byte
      size += varintSize(this.namespaceVersion);
    }

    const buffer = new Uint8Array(size);
    let offset = 0;

    // Write namespace_id (field 1)
    if (this.namespaceId.length > 0) {
      buffer[offset++] = 0x0a; // tag: (field_number << 3) | wire_type = (1 << 3) | 2
      const lenBytes = writeVarint(this.namespaceId.length);
      buffer.set(lenBytes, offset);
      offset += lenBytes.length;
      buffer.set(this.namespaceId, offset);
      offset += this.namespaceId.length;
    }

    // Write data (field 2)
    if (this.data.length > 0) {
      buffer[offset++] = 0x12; // tag: (field_number << 3) | wire_type = (2 << 3) | 2
      const lenBytes = writeVarint(this.data.length);
      buffer.set(lenBytes, offset);
      offset += lenBytes.length;
      buffer.set(this.data, offset);
      offset += this.data.length;
    }

    // Write share_version (field 3)
    if (this.shareVersion !== 0) {
      buffer[offset++] = 0x18; // tag: (field_number << 3) | wire_type = (3 << 3) | 0
      const verBytes = writeVarint(this.shareVersion);
      buffer.set(verBytes, offset);
      offset += verBytes.length;
    }

    // Write namespace_version (field 4)
    if (this.namespaceVersion !== 0) {
      buffer[offset++] = 0x20; // tag: (field_number << 3) | wire_type = (4 << 3) | 0
      const verBytes = writeVarint(this.namespaceVersion);
      buffer.set(verBytes, offset);
      offset += verBytes.length;
    }

    return buffer;
  }

  static deserializeBinary(bytes: Uint8Array): Blob {
    const blob = new Blob();
    let offset = 0;

    const readVarint = (
      bytes: Uint8Array,
      offset: number
    ): [number, number] => {
      let result = 0;
      let shift = 0;
      let byte;
      let bytesRead = 0;

      do {
        byte = bytes[offset + bytesRead];
        result |= (byte & 0x7f) << shift;
        shift += 7;
        bytesRead++;
      } while (byte & 0x80);

      return [result >>> 0, bytesRead]; // Convert to unsigned
    };

    while (offset < bytes.length) {
      const tag = bytes[offset++];
      const fieldNum = tag >>> 3;
      const wireType = tag & 0x7;

      switch (fieldNum) {
        case 1: // namespace_id
          if (wireType !== 2)
            throw new Error("Invalid wire type for bytes field");
          const [nsIdLen, nsIdVarIntLen] = readVarint(bytes, offset);
          offset += nsIdVarIntLen;
          blob.setNamespaceId(bytes.slice(offset, offset + nsIdLen));
          offset += nsIdLen;
          break;

        case 2: // data
          if (wireType !== 2)
            throw new Error("Invalid wire type for bytes field");
          const [dataLen, dataVarIntLen] = readVarint(bytes, offset);
          offset += dataVarIntLen;
          blob.setData(bytes.slice(offset, offset + dataLen));
          offset += dataLen;
          break;

        case 3: // share_version
          if (wireType !== 0)
            throw new Error("Invalid wire type for uint32 field");
          const [shareVer, shareVerVarIntLen] = readVarint(bytes, offset);
          offset += shareVerVarIntLen;
          blob.setShareVersion(shareVer);
          break;

        case 4: // namespace_version
          if (wireType !== 0)
            throw new Error("Invalid wire type for uint32 field");
          const [nsVer, nsVerVarIntLen] = readVarint(bytes, offset);
          offset += nsVerVarIntLen;
          blob.setNamespaceVersion(nsVer);
          break;

        default:
          throw new Error(`Unknown field number: ${fieldNum}`);
      }
    }

    return blob;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }
}
