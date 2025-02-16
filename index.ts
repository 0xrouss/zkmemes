/** Vendor */
import Long from "long";
import Base64 from "crypto-js/enc-base64";
import Hex from "crypto-js/enc-hex";

/** API */
import { fetchAddressByHash } from "@/services/api/address";

import { AuthInfo, Fee, TxBody, TxRaw } from "./proto/gen/tx";
import { SignMode } from "./proto/gen/signing";
import { PubKey } from "./proto/gen/keys";
import { MsgPayForBlobs } from "./proto/gen/msg_pay_for_blobs";
import { prepareBlob } from "./utils/prepareBlob";
import { CHAIN_ID } from "./components/WalletConnect";
import { Blob } from "./proto/gen";
import { BroadcastMode } from "@keplr-wallet/types";

declare global {
  interface Window {
    wallet: {
      getKey: (chainId: string) => Promise<{ pubKey: Uint8Array }>;
      signDirect: (
        chainId: string,
        signer: string,
        signDoc: any
      ) => Promise<any>;
      sendTx: (
        chainId: string,
        tx: Uint8Array,
        mode: string
      ) => Promise<Uint8Array>;
    };
  }
}

interface Network {
  chainId: string;
  rest: string;
}

interface FeeAmount {
  denom: string;
  amount: string;
}

interface TransactionFee {
  amount: FeeAmount[];
  gas: string;
}

interface Account {
  sequence: string;
  account_number: string;
}

class BlobTx {
  private tx: Uint8Array;
  private blobs: Blob[];
  private typeId: string;

  constructor(data?: { tx?: Uint8Array; blobs?: Blob[]; typeId?: string }) {
    this.tx = data?.tx || new Uint8Array();
    this.blobs = data?.blobs || [];
    this.typeId = data?.typeId || "";
  }

  setTx(value: Uint8Array): BlobTx {
    this.tx = value;
    return this;
  }

  addBlobs(value: Blob): BlobTx {
    this.blobs.push(value);
    return this;
  }

  setTypeId(value: string): BlobTx {
    this.typeId = value;
    return this;
  }

  serializeBinary(): Uint8Array {
    console.log("serializeBinary", this);
    // Calculate total size
    const txLength = this.tx.length;
    let totalSize = 0;

    // tx field (field number 1)
    if (txLength > 0) {
      totalSize += 1 + this.varintSize(txLength) + txLength;
    }

    console.log("totalSize:", totalSize);

    // blobs field (field number 2)
    for (const blob of this.blobs) {
      const blobBytes = blob.serializeBinary();
      totalSize += 1 + this.varintSize(blobBytes.length) + blobBytes.length;
    }

    console.log("blobBytesLength:", this.blobs[0].serializeBinary());

    console.log("totalSize2:", totalSize);

    // typeId field (field number 3)
    if (this.typeId.length > 0) {
      const typeIdBytes = new TextEncoder().encode(this.typeId);
      totalSize += 1 + this.varintSize(typeIdBytes.length) + typeIdBytes.length;
    }

    console.log("totalSize3:", totalSize);

    const buffer = new Uint8Array(totalSize);
    let offset = 0;

    // Write tx field
    if (txLength > 0) {
      buffer[offset++] = (1 << 3) | 2; // field number 1, wire type 2
      offset = this.writeVarint(buffer, txLength, offset);
      buffer.set(this.tx, offset);
      offset += txLength;
    }

    console.log("buffer1:", buffer);

    // Write blobs field
    for (const blob of this.blobs) {
      const blobBytes = blob.serializeBinary();
      buffer[offset++] = (2 << 3) | 2; // field number 2, wire type 2
      offset = this.writeVarint(buffer, blobBytes.length, offset);
      buffer.set(blobBytes, offset);
      offset += blobBytes.length;
    }

    console.log("buffer2:", buffer);

    // Write typeId field
    if (this.typeId.length > 0) {
      const typeIdBytes = new TextEncoder().encode(this.typeId);
      buffer[offset++] = (3 << 3) | 2; // field number 3, wire type 2
      offset = this.writeVarint(buffer, typeIdBytes.length, offset);
      buffer.set(typeIdBytes, offset);
    }

    console.log("buffer3:", buffer);

    console.log("buffer:", buffer);
    return buffer;
  }

  private varintSize(value: number): number {
    let size = 0;
    while (value > 0) {
      size++;
      value >>>= 7;
    }
    return size || 1;
  }

  private writeVarint(
    buffer: Uint8Array,
    value: number,
    offset: number
  ): number {
    while (value > 0x7f) {
      buffer[offset++] = (value & 0x7f) | 0x80;
      value >>>= 7;
    }
    buffer[offset++] = value;
    return offset;
  }
}

const buildPayForBlob = (tx: Uint8Array, blob: Blob) => {
  console.log("buildPayForBlob", tx, blob, typeof tx, typeof blob);
  const blobTx = new BlobTx();
  blobTx.setTx(tx);
  blobTx.setTypeId("BLOB");
  blobTx.addBlobs(blob);
  return blobTx.serializeBinary();
};

export const fetchAccountInfo = async (
  address: string
): Promise<Account | undefined> => {
  try {
    const uri = `https://api.celestia-arabica-11.com/cosmos/auth/v1beta1/accounts/${address}`;
    const response = await fetch(uri);
    const data = await response.json();
    return data.account;
  } catch (e) {
    return undefined;
  }
};

export const broadcastTxSync = async (
  chainId: string,
  tx: Uint8Array
): Promise<Uint8Array> => {
  const mode = BroadcastMode?.Sync || "sync";
  console.log(tx);
  return window.keplr!.sendTx(chainId, tx, mode);
};

export const decodeSignature = (s: string): Uint8Array => {
  return fromHexString(Base64.parse(s).toString(Hex));
};

export const fromHexString = (hexString: string): Uint8Array => {
  return Uint8Array.from(
    hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
};

export const sendPayForBlob = async (
  network: string,
  sender: string,
  proto: any,
  fee: TransactionFee,
  blob: any,
  namespace: string
) => {
  const account = await fetchAccountInfo(sender);

  const response = await window.keplr!.getKey(CHAIN_ID);
  const { pubKey } = response;

  console.log("proto:", proto);
  const tx = TxBody.encode(
    TxBody.fromPartial({
      messages: [proto],
      memo: "Sent via Celenium.io",
    })
  ).finish();

  console.log("tx:", tx);

  console.log("-----------------------");
  console.log("Transaction (tx):", tx);

  if (account) {
    const signDoc = {
      bodyBytes: tx,
      authInfoBytes: AuthInfo.encode({
        signerInfos: [
          {
            publicKey: {
              typeUrl: "/cosmos.crypto.secp256k1.PubKey",
              value: PubKey.encode({
                key: pubKey,
              }).finish(),
            },
            modeInfo: {
              single: {
                mode: SignMode.SIGN_MODE_DIRECT,
              },
              multi: undefined,
            },
            sequence: account.sequence,
          },
        ],
        fee: Fee.fromPartial({
          amount: fee.amount.map((coin) => ({
            denom: coin.denom,
            amount: coin.amount.toString(),
          })),
          gasLimit: fee.gas,
        }),
      }).finish(),
      chainId: CHAIN_ID,
      accountNumber: Long.fromString(account.account_number),
    };

    console.log("SignDoc:", signDoc);

    const signed = await window.keplr!.signDirect(CHAIN_ID, sender, signDoc);

    console.log("signed:", signed);

    const blobTx = buildPayForBlob(
      TxRaw.encode({
        bodyBytes: signed.signed.bodyBytes,
        authInfoBytes: signed.signed.authInfoBytes,
        signatures: [decodeSignature(signed.signature.signature)],
      }).finish(),
      blob
    );

    const x = Fee.fromPartial({
      amount: fee.amount.map((coin) => ({
        denom: coin.denom,
        amount: coin.amount.toString(),
      })),
    });
    console.log("x", x);

    // const protoBufTx = TxRaw.encode({
    //   bodyBytes: signed.signed.bodyBytes,
    //   authInfoBytes: signed.signed.authInfoBytes,
    //   signatures: [Buffer.from(signed.signature.signature, "base64")],
    // }).finish();

    // console.log("protoBufTx:", protoBufTx);

    // const mode = BroadcastMode?.Sync || "sync";
    // const txResponse = await window.keplr!.sendTx(CHAIN_ID, protoBufTx, mode);
    // const txHash = Buffer.from(txResponse).toString("hex");

    // return txHash;

    const txReponse = await broadcastTxSync(CHAIN_ID, blobTx);
    const txHash = Buffer.from(txReponse).toString("hex");

    return Buffer.from(txHash).toString("hex");
  }
};
