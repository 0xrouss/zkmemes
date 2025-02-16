"use client";

import { useState, useRef } from "react";
import WalletConnect, { CHAIN_ID } from "@/components/WalletConnect";
import { prepareBlob } from "@/utils/prepareBlob";
import { fetchEstimatedGas } from "@/utils/fetchEstimatedGas";
import { sendPayForBlob } from "..";

export default function Home() {
  const [namespace, setNamespace] = useState("");
  const [namespaceError, setNamespaceError] = useState("");
  const [blob, setBlob] = useState<Uint8Array | null>(null);
  const [fileType, setFileType] = useState<string>("");

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleNamespaceChange = (value: string) => {
    setNamespace(value);

    if (
      (!/^[0-9a-fA-F]+$/g.test(value) && value.length >= 4) ||
      value.length > 58
    ) {
      setNamespaceError("Validation error");
      return;
    }

    if (value.length) {
      const numValue = BigInt("0x" + value);
      const maxValue = BigInt(
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00"
      );

      if (numValue > 0xff && numValue < maxValue) {
        setNamespaceError("");
      } else {
        setNamespaceError("Validation error");
      }
    } else {
      setNamespaceError("");
    }
  };

  const handleUpload = (e: any, target: "drop" | "select") => {
    const file =
      target === "drop" ? e.dataTransfer.files[0] : e.target.files[0];

    if (file.size > 80_000) {
      alert("Max file size is 25kb");
      return;
    }

    if (!["text/plain", "image/png", "image/jpeg"].includes(file.type)) {
      alert("Only text or image files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = function (e) {
      if (e.target) {
        const bytes = new Uint8Array(e.target.result as ArrayBuffer);
        setBlob(bytes);
        setFileType(file.type);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!window.keplr) {
      alert("Keplr is not installed");
      return;
    }

    const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
    const accounts = await offlineSigner.getAccounts();
    const address = accounts[0].address;

    if (!blob) {
      alert("Blob is not available");
      return;
    }

    const hexString = [...blob]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const [data, decodableBlob, length] = prepareBlob(
      address,
      namespace,
      hexString
    );

    console.log("handleContinue", data, decodableBlob, length);

    if (typeof length !== "number") {
      alert("Invalid length value");
      return;
    }

    let estimatedGas = await fetchEstimatedGas(length);
    console.log("estimatedGas", estimatedGas);

    let gasPrice = 0;

    let fee =
      gasPrice * estimatedGas > 1
        ? Math.trunc(gasPrice * estimatedGas).toString()
        : "10000";

    const proto = [
      {
        typeUrl: "/celestia.blob.v1.MsgPayForBlobs",
        value: data,
      },
    ];
    const stdFee = {
      amount: [
        {
          denom: "utia",
          amount: "80000",
        },
      ],
      gas: estimatedGas,
    };

    const txHash = await sendPayForBlob(
      CHAIN_ID,
      address,
      proto,
      stdFee,
      decodableBlob,
      namespace
    );
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <WalletConnect />

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold">Submit data blob</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Namespace
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    0x
                  </span>
                  <input
                    type="text"
                    value={namespace}
                    onChange={(e) => handleNamespaceChange(e.target.value)}
                    className="w-full px-8 py-2 rounded-lg border bg-transparent"
                    placeholder="Enter namespace"
                  />
                  {namespaceError && (
                    <span className="text-yellow-500 text-xs mt-1 flex items-center gap-1">
                      ⚠️ {namespaceError}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  File
                </label>
                {!blob ? (
                  <label
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer"
                    onDrop={(e) => {
                      e.preventDefault();
                      handleUpload(e, "drop");
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <input
                      ref={uploadInputRef}
                      type="file"
                      onChange={(e) => handleUpload(e, "select")}
                      accept="image/png,image/jpeg,text/plain"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-gray-500">📤</span>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Drag and drop the file you want to submit
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPEG or TXT, max size 25kb
                        </p>
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span>📄</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          File to submit
                        </span>
                        <span className="text-xs text-gray-500">
                          {fileType}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setBlob(null)}
                      className="px-3 py-1 text-sm rounded-full border hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={Boolean(!blob || !namespace || namespaceError)}
                className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Submit Blob
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
