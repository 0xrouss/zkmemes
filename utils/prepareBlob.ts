import { sha256 } from "js-sha256";
import { Tree } from "./tree";
import { Blob as ProtoBlob, MsgPayForBlobs } from "../proto/gen";

const shareSize = 512;
const subTreeRootThreshold = 64;

export function hex2Bytes(hex: string) {
  var arr = [];
  for (var i = 0; i < hex.length; i += 2)
    arr.push(parseInt(hex.substr(i, 2), 16));
  return arr;
}

export function prepareBlob(signer: string, ns: string, data: string) {
  ns = ns.replace("0x", "").padStart(56, "0");
  data = data.replace("0x", "");

  let blob = {
    namespace_id: new Uint8Array(hex2Bytes(ns)),
    version: 0,
    share_version: 0,
    data: new Uint8Array(hex2Bytes(data)),
  };

  let pfb = newMsgPayForBlob(signer, blob);
  console.log("pfb", pfb);
  if (!pfb) {
    throw new Error("Failed to create MsgPayForBlob");
  }
  let msg = pfb.serializeBinary();

  let decodableBlob = new ProtoBlob({
    namespaceId: fromHexString(ns),
    data: fromHexString(data),
    shareVersion: 0,
    namespaceVersion: 0,
  });

  return [msg, decodableBlob, blob.data.length];
}

export const fromHexString = (hexString: string) => {
  const matches = hexString.match(/.{1,2}/g);
  return Uint8Array.from(
    matches ? matches.map((byte) => parseInt(byte, 16)) : []
  );
};

interface Blob {
  version: number;
  namespace_id: Uint8Array;
  share_version: number;
  data: Uint8Array;
}

function supportedVersion(version: number) {
  return version === 0;
}

function supportedShareVersion(version: number) {
  return version === 0;
}

function newMsgPayForBlob(signer: string, blob: Blob) {
  if (blob.version > 255 || !supportedVersion(blob.version)) {
    console.error("invalid version", blob.version);
    return;
  }

  if (reserved(blob.namespace_id)) {
    console.error("try to send to reserved namespace", blob.namespace_id);
    return;
  }

  if (blob.data.length === 0) {
    console.error("try to send empty blob");
    return;
  }

  if (!supportedShareVersion(blob.share_version)) {
    console.error("unsupported share version");
    return;
  }

  let namespace = new Uint8Array(29);
  namespace.set([blob.version]);
  namespace.set(blob.namespace_id, 1);

  let commitment = createCommitments(blob);

  let pfb = new MsgPayForBlobs();
  pfb.setSigner(signer);
  pfb.addNamespaces(namespace);
  pfb.addBlobSizes(blob.data.length);
  pfb.addShareCommitments(commitment);
  pfb.addShareVersions(blob.share_version);
  return pfb;
}

export function createCommitments(blob: Blob) {
  let shares = createShares(blob);
  let stw = subTreeWidth(shares.length, subTreeRootThreshold);
  let treeSizes = merkleMountainRangeSizes(shares.length, stw);

  let leafSets = [];
  let cursor = 0;
  for (let i = 0; i < treeSizes.length; i++) {
    let s = shares
      .slice(cursor, cursor + treeSizes[i])
      .filter(
        (share): share is number[] =>
          share !== undefined && Array.isArray(share)
      );
    leafSets.push(sharesToBytes(s.map((arr) => new Uint8Array(arr))));
    cursor += treeSizes[i];
  }

  let subTreeRoots = [];
  for (let i = 0; i < leafSets.length; i++) {
    const tree = new Tree(sha256.digest);
    for (let j = 0; j < leafSets[i].length; j++) {
      let leaf = [blob.version];
      leaf.push(...blob.namespace_id);
      leaf.push(...leafSets[i][j]);
      tree.push(leaf);
    }
    let root = tree.getRoot();
    subTreeRoots.push(root);
  }

  return hashFromByteSlices(subTreeRoots.map((root) => new Uint8Array(root)));
}

function createShares(blob: Blob) {
  let shares = [];
  var [share, left] = createCompactShare(blob, blob.data, true);
  shares.push(share);

  while (left !== undefined) {
    [share, left] = createCompactShare(blob, new Uint8Array(left), false);
    shares.push(share);
  }

  return shares;
}

function sharesToBytes(shares: Uint8Array[]) {
  let bytes = [];
  for (let i = 0; i < shares.length; i++) {
    bytes.push(shares[i]);
  }
  return bytes;
}

function hashFromByteSlices(slices: Uint8Array[]) {
  if (slices.length === 0) {
    return new Uint8Array(0);
  }
  if (slices.length === 1) {
    let arr = [0];
    arr.push(...slices[0]);
    return hash(new Uint8Array(arr));
  }

  let sp = getSplitPoint(slices.length);
  let left = hashFromByteSlices(slices.slice(0, sp));
  let right = hashFromByteSlices(slices.slice(sp, slices.length));
  let arr = [1];
  arr.push(...left);
  arr.push(...right);
  return hash(new Uint8Array(arr));
}

function createCompactShare(
  blob: Blob,
  data: Uint8Array,
  isFirstShare: boolean
) {
  let shareData = [blob.version];
  shareData.push(...blob.namespace_id);
  shareData.push(infoByte(blob.version, isFirstShare));
  if (isFirstShare) {
    shareData.push(...int32ToBytes(data.length));
  }
  let padding = shareSize - shareData.length;

  if (padding >= data.length) {
    shareData.push(...data);
    for (let i = data.length; i < padding; i++) {
      shareData.push(0);
    }
    return [shareData, undefined];
  }

  shareData.push(...data.slice(0, padding));
  return [shareData, data.slice(padding, data.length)];
}

function reserved(nsId: Uint8Array) {
  return isPrimaryReserved(nsId) || isSecondaryReserved(nsId);
}

function infoByte(version: number, isFirstShare: boolean) {
  let prefix = version << 1;
  return isFirstShare ? prefix + 1 : prefix;
}

function int32ToBytes(i: number) {
  var arr = [0, 0, 0, 0];
  for (let index = arr.length - 1; index > -1; index--) {
    var byte = i & 0xff;
    arr[index] = byte;
    i = i >> 8;
  }
  return arr;
}

function isPrimaryReserved(nsId: Uint8Array) {
  var reserved = true;
  for (let i = 0; i < nsId.length - 1; i++) {
    if (nsId[i] !== 0) {
      reserved = false;
      break;
    }
  }
  return reserved;
}

function isSecondaryReserved(nsId: Uint8Array) {
  var reserved = true;
  for (let i = 0; i < nsId.length - 1; i++) {
    if (nsId[i] !== 0xff) {
      reserved = false;
      break;
    }
  }
  return reserved && nsId[nsId.length - 1] === 0;
}

function subTreeWidth(sharesCount: number, threshold: number) {
  let s = Math.floor(sharesCount / threshold);
  if (sharesCount % threshold != 0) {
    s++;
  }
  s = roundUpPowerOfTwo(s);
  let minSquareSize = roundUpPowerOfTwo(Math.ceil(Math.sqrt(s)));
  return minSquareSize < s ? minSquareSize : s;
}

function roundUpPowerOfTwo(s: number) {
  let pwr = 1;
  while (pwr < s) {
    pwr <<= 1;
  }
  return pwr;
}

function roundDownPowerOfTwo(s: number) {
  let pwr = roundUpPowerOfTwo(s);
  if (pwr === s) return pwr;
  return pwr / 2;
}

function hash(data: Uint8Array) {
  return new Uint8Array(sha256.digest(data));
}

function merkleMountainRangeSizes(totalSize: number, maxTreeSize: number) {
  let treeSizes = [];

  while (totalSize > 0) {
    if (totalSize >= maxTreeSize) {
      treeSizes.push(maxTreeSize);
      totalSize -= maxTreeSize;
    } else {
      let size = roundDownPowerOfTwo(totalSize);
      treeSizes.push(size);
      totalSize -= size;
    }
  }

  return treeSizes;
}

export function getSplitPoint(length: number) {
  if (length < 1) {
    console.error("Trying to split a tree with size < 1");
    return 0;
  }
  let b = 0;
  for (let i = 1; i < length; i <<= 1) {
    b++;
  }
  let k = 1 << (b - 1);
  if (k === length) {
    k >>= 1;
  }
  return k;
}
