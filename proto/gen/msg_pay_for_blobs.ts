export class MsgPayForBlobs {
  private static readonly FIELD_SIGNER = 1;
  private static readonly FIELD_NAMESPACES = 2;
  private static readonly FIELD_BLOB_SIZES = 3;
  private static readonly FIELD_SHARE_COMMITMENTS = 4;
  private static readonly FIELD_SHARE_VERSIONS = 8;

  private signer: string;
  private namespaces: Uint8Array[];
  private blobSizes: number[];
  private shareCommitments: Uint8Array[];
  private shareVersions: number[];

  constructor(data?: {
    signer?: string;
    namespaces?: Uint8Array[];
    blobSizes?: number[];
    shareCommitments?: Uint8Array[];
    shareVersions?: number[];
  }) {
    this.signer = data?.signer || "";
    this.namespaces = data?.namespaces || [];
    this.blobSizes = data?.blobSizes || [];
    this.shareCommitments = data?.shareCommitments || [];
    this.shareVersions = data?.shareVersions || [];
  }

  // Getters
  getSigner(): string {
    return this.signer;
  }

  getNamespacesList(): Uint8Array[] {
    return this.namespaces;
  }

  getNamespacesList_asB64(): string[] {
    return this.namespaces.map((bytes) => this.bytesToBase64(bytes));
  }

  getNamespacesList_asU8(): Uint8Array[] {
    return this.namespaces;
  }

  getBlobSizesList(): number[] {
    return this.blobSizes;
  }

  getShareCommitmentsList(): Uint8Array[] {
    return this.shareCommitments;
  }

  getShareCommitmentsList_asB64(): string[] {
    return this.shareCommitments.map((bytes) => this.bytesToBase64(bytes));
  }

  getShareCommitmentsList_asU8(): Uint8Array[] {
    return this.shareCommitments;
  }

  getShareVersionsList(): number[] {
    return this.shareVersions;
  }

  // Setters
  setSigner(value: string): MsgPayForBlobs {
    this.signer = value;
    return this;
  }

  setNamespacesList(value: Uint8Array[]): MsgPayForBlobs {
    this.namespaces = value || [];
    return this;
  }

  setBlobSizesList(value: number[]): MsgPayForBlobs {
    this.blobSizes = value || [];
    return this;
  }

  setShareCommitmentsList(value: Uint8Array[]): MsgPayForBlobs {
    this.shareCommitments = value || [];
    return this;
  }

  setShareVersionsList(value: number[]): MsgPayForBlobs {
    this.shareVersions = value || [];
    return this;
  }

  // Array manipulation methods
  addNamespaces(value: Uint8Array, optIndex?: number): MsgPayForBlobs {
    if (optIndex !== undefined) {
      this.namespaces.splice(optIndex, 0, value);
    } else {
      this.namespaces.push(value);
    }
    return this;
  }

  addBlobSizes(value: number, optIndex?: number): MsgPayForBlobs {
    if (optIndex !== undefined) {
      this.blobSizes.splice(optIndex, 0, value);
    } else {
      this.blobSizes.push(value);
    }
    return this;
  }

  addShareCommitments(value: Uint8Array, optIndex?: number): MsgPayForBlobs {
    if (optIndex !== undefined) {
      this.shareCommitments.splice(optIndex, 0, value);
    } else {
      this.shareCommitments.push(value);
    }
    return this;
  }

  addShareVersions(value: number, optIndex?: number): MsgPayForBlobs {
    if (optIndex !== undefined) {
      this.shareVersions.splice(optIndex, 0, value);
    } else {
      this.shareVersions.push(value);
    }
    return this;
  }

  // Clear methods
  clearNamespacesList(): MsgPayForBlobs {
    this.namespaces = [];
    return this;
  }

  clearBlobSizesList(): MsgPayForBlobs {
    this.blobSizes = [];
    return this;
  }

  clearShareCommitmentsList(): MsgPayForBlobs {
    this.shareCommitments = [];
    return this;
  }

  clearShareVersionsList(): MsgPayForBlobs {
    this.shareVersions = [];
    return this;
  }

  // Serialization methods
  toObject(includeInstance?: boolean): {
    signer: string;
    namespacesList: string[];
    blobSizesList: number[];
    shareCommitmentsList: string[];
    shareVersionsList: number[];
    $jspbMessageInstance?: MsgPayForBlobs;
  } {
    const obj: {
      signer: string;
      namespacesList: string[];
      blobSizesList: number[];
      shareCommitmentsList: string[];
      shareVersionsList: number[];
      $jspbMessageInstance?: MsgPayForBlobs;
    } = {
      signer: this.signer,
      namespacesList: this.getNamespacesList_asB64(),
      blobSizesList: this.blobSizes,
      shareCommitmentsList: this.getShareCommitmentsList_asB64(),
      shareVersionsList: this.shareVersions,
    };

    if (includeInstance) {
      obj.$jspbMessageInstance = this;
    }

    return obj;
  }

  serializeBinary(): Uint8Array {
    const writer = new BinaryWriter();

    // Write signer (field 1)
    if (this.signer.length > 0) {
      writer.writeString(MsgPayForBlobs.FIELD_SIGNER, this.signer);
    }

    // Write namespaces (field 2)
    if (this.namespaces.length > 0) {
      writer.writeRepeatedBytes(
        MsgPayForBlobs.FIELD_NAMESPACES,
        this.namespaces
      );
    }

    // Write blob sizes (field 3)
    if (this.blobSizes.length > 0) {
      writer.writePackedUint32(MsgPayForBlobs.FIELD_BLOB_SIZES, this.blobSizes);
    }

    // Write share commitments (field 4)
    if (this.shareCommitments.length > 0) {
      writer.writeRepeatedBytes(
        MsgPayForBlobs.FIELD_SHARE_COMMITMENTS,
        this.shareCommitments
      );
    }

    // Write share versions (field 8)
    if (this.shareVersions.length > 0) {
      writer.writePackedUint32(
        MsgPayForBlobs.FIELD_SHARE_VERSIONS,
        this.shareVersions
      );
    }

    return writer.getBuffer();
  }

  static deserializeBinary(bytes: Uint8Array): MsgPayForBlobs {
    const reader = new BinaryReader(bytes);
    const msg = new MsgPayForBlobs();

    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case MsgPayForBlobs.FIELD_SIGNER:
          msg.setSigner(reader.readString());
          break;
        case MsgPayForBlobs.FIELD_NAMESPACES:
          msg.addNamespaces(reader.readBytes());
          break;
        case MsgPayForBlobs.FIELD_BLOB_SIZES:
          msg.setBlobSizesList(reader.readPackedUint32());
          break;
        case MsgPayForBlobs.FIELD_SHARE_COMMITMENTS:
          msg.addShareCommitments(reader.readBytes());
          break;
        case MsgPayForBlobs.FIELD_SHARE_VERSIONS:
          msg.setShareVersionsList(reader.readPackedUint32());
          break;
        default:
          reader.skipField();
          break;
      }
    }

    return msg;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }
}

// Helper classes for binary serialization
class BinaryWriter {
  private buffer: number[] = [];

  writeString(fieldNumber: number, value: string): void {
    const bytes = new TextEncoder().encode(value);
    this.writeBytes(fieldNumber, bytes);
  }

  writeBytes(fieldNumber: number, value: Uint8Array): void {
    this.writeTag(fieldNumber, 2); // 2 = length-delimited wire type
    this.writeVarint(value.length);
    this.buffer.push(...Array.from(value));
  }

  writeRepeatedBytes(fieldNumber: number, values: Uint8Array[]): void {
    for (const value of values) {
      this.writeBytes(fieldNumber, value);
    }
  }

  writePackedUint32(fieldNumber: number, values: number[]): void {
    if (values.length === 0) return;

    this.writeTag(fieldNumber, 2); // 2 = length-delimited wire type

    // Calculate packed size
    let size = 0;
    for (const value of values) {
      size += this.computeVarintSize(value);
    }

    this.writeVarint(size);

    // Write values
    for (const value of values) {
      this.writeVarint(value);
    }
  }

  private writeTag(fieldNumber: number, wireType: number): void {
    this.writeVarint((fieldNumber << 3) | wireType);
  }

  private writeVarint(value: number): void {
    while (value > 127) {
      this.buffer.push((value & 0x7f) | 0x80);
      value >>>= 7;
    }
    this.buffer.push(value);
  }

  private computeVarintSize(value: number): number {
    let size = 0;
    while (value > 127) {
      size++;
      value >>>= 7;
    }
    return size + 1;
  }

  getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

class BinaryReader {
  private view: DataView;
  private pos: number = 0;
  private lastTag: number = 0;

  constructor(private bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer);
  }

  nextField(): boolean {
    if (this.pos >= this.bytes.length) {
      return false;
    }
    this.lastTag = this.readVarint();
    return true;
  }

  getFieldNumber(): number {
    return this.lastTag >>> 3;
  }

  readString(): string {
    const bytes = this.readBytes();
    return new TextDecoder().decode(bytes);
  }

  readBytes(): Uint8Array {
    const length = this.readVarint();
    const bytes = this.bytes.slice(this.pos, this.pos + length);
    this.pos += length;
    return bytes;
  }

  readPackedUint32(): number[] {
    const length = this.readVarint();
    const end = this.pos + length;
    const result: number[] = [];

    while (this.pos < end) {
      result.push(this.readVarint());
    }

    return result;
  }

  skipField(): void {
    const wireType = this.lastTag & 0x7;
    switch (wireType) {
      case 0: // varint
        this.readVarint();
        break;
      case 1: // 64-bit
        this.pos += 8;
        break;
      case 2: // length-delimited
        const length = this.readVarint();
        this.pos += length;
        break;
      case 5: // 32-bit
        this.pos += 4;
        break;
      default:
        throw new Error(`Unknown wire type: ${wireType}`);
    }
  }

  private readVarint(): number {
    let result = 0;
    let shift = 0;

    while (true) {
      const byte = this.bytes[this.pos++];
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) {
        return result;
      }
      shift += 7;
      if (shift > 28) {
        throw new Error("Invalid varint");
      }
    }
  }
}
