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
    // Simple binary format:
    // [namespace_id_length(4 bytes)][namespace_id][data_length(4 bytes)][data][share_version(4 bytes)][namespace_version(4 bytes)]
    const namespaceIdLength = this.namespaceId.length;
    const dataLength = this.data.length;
    const totalLength = 16 + namespaceIdLength + dataLength; // 16 = 4 lengths/versions * 4 bytes each

    const buffer = new Uint8Array(totalLength);
    let offset = 0;

    // Write namespace_id length and data
    this.writeUint32(buffer, namespaceIdLength, offset);
    offset += 4;
    buffer.set(this.namespaceId, offset);
    offset += namespaceIdLength;

    // Write data length and data
    this.writeUint32(buffer, dataLength, offset);
    offset += 4;
    buffer.set(this.data, offset);
    offset += dataLength;

    // Write versions
    this.writeUint32(buffer, this.shareVersion, offset);
    offset += 4;
    this.writeUint32(buffer, this.namespaceVersion, offset);

    return buffer;
  }

  static deserializeBinary(bytes: Uint8Array): Blob {
    let offset = 0;

    // Read namespace_id
    const namespaceIdLength = new DataView(bytes.buffer).getUint32(offset);
    offset += 4;
    const namespaceId = bytes.slice(offset, offset + namespaceIdLength);
    offset += namespaceIdLength;

    // Read data
    const dataLength = new DataView(bytes.buffer).getUint32(offset);
    offset += 4;
    const data = bytes.slice(offset, offset + dataLength);
    offset += dataLength;

    // Read versions
    const shareVersion = new DataView(bytes.buffer).getUint32(offset);
    offset += 4;
    const namespaceVersion = new DataView(bytes.buffer).getUint32(offset);

    return new Blob({
      namespaceId,
      data,
      shareVersion,
      namespaceVersion,
    });
  }

  private writeUint32(buffer: Uint8Array, value: number, offset: number) {
    new DataView(buffer.buffer).setUint32(offset, value);
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }
}
