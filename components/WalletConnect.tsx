"use client";

import { useState, useEffect } from "react";
import { Window as KeplrWindow } from "@keplr-wallet/types";

declare global {
  interface Window extends KeplrWindow {}
}

export const CHAIN_ID = "arabica-11";

export default function WalletConnect() {
  const [address, setAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [signature, setSignature] = useState<string>("");

  const connectWallet = async () => {
    try {
      // Check if Keplr is installed
      if (!window.keplr) {
        alert("Please install Keplr extension");
        return;
      }

      // Request connection to Osmosis testnet
      await window.keplr.enable(CHAIN_ID);

      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);

      // Get user address
      const accounts = await offlineSigner.getAccounts();
      const userAddress = accounts[0].address;

      setAddress(userAddress);
      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting to Keplr:", error);
      alert("Failed to connect to Keplr");
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setIsConnected(false);
    setSignature("");
  };

  const signMessage = async () => {
    try {
      if (!window.keplr || !address) return;

      const messageToSign = "Hello World";

      // Sign the message
      const signResponse = await window.keplr.signArbitrary(
        CHAIN_ID,
        address,
        messageToSign
      );

      setSignature(signResponse.signature);
    } catch (error) {
      console.error("Error signing message:", error);
      alert("Failed to sign message");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!isConnected ? (
        <button
          onClick={connectWallet}
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        >
          Connect Keplr
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-mono">{address}</p>

          <button
            onClick={signMessage}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Sign "Hello World"
          </button>

          {signature && (
            <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xl">
              <p className="text-xs font-mono break-all">
                Signature: {signature}
              </p>
            </div>
          )}

          <button
            onClick={disconnectWallet}
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
