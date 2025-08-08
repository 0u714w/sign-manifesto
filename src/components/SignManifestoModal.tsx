"use client";
import React, { useState, useEffect } from "react";

interface SignManifestoModalProps {
  open: boolean;
  onClose: () => void;
  onSign?: (name: string) => void;
  onConnectWallet: () => void;
  ensName?: string;
  walletAddress?: string;
  onCollect?: (name: string) => void;
  minting?: boolean;
}

export default function SignManifestoModal({
  open,
  onClose,
  onSign,
  onConnectWallet,
  ensName = "",
  walletAddress = "",
  onCollect,
  minting = false,
}: SignManifestoModalProps) {
  const [name, setName] = useState(ensName);
  const [step, setStep] = useState<'input' | 'collect'>('input');

  useEffect(() => {
    setName(ensName || "");
  }, [ensName]);

  useEffect(() => {
    if (!open) setStep('input');
  }, [open]);

  if (!open) return null;

  // Step 1: Input name
  if (step === 'input') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-8 flex flex-col items-center">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 focus:outline-none"
            aria-label="Close"
          >
            <img src="/images/close_square.svg" alt="Close" className="w-6 h-6" />
          </button>
          {/* Header */}
          <h2 className="font-videocond font-bold text-3xl mb-4 text-center">ADD YOUR SIGNATURE</h2>
          {/* Body */}
          <p className="font-videocond font-light text-lg mb-6 text-center">
            Enter the name you would like to sign with.<br />
            Leave it blank to use your wallet address.
          </p>
          {/* Name input */}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="your name here"
            className="w-full border border-gray-400 rounded-lg px-4 py-2 mb-6 text-lg font-videocond text-center focus:outline-none focus:ring-2 focus:ring-black"
          />
          {/* CTA button */}
          <button
            onClick={() => setStep('collect')}
            className="bg-black text-white rounded-full px-6 py-2 font-videocond font-bold text-xl mb-1 hover:bg-gray-900 transition"
          >
            CONTINUE
          </button>
          {/* Connect external wallet link */}
          <button
            onClick={async () => {

          const fakeData = {
            name: "Test User",
            date: "January 1, 2025",
            signature: "0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234",
            signerNumber: "42",
            isMobile: "true"
          };

          const params = new URLSearchParams(fakeData).toString();
          const res = await fetch(`/api/generate-artwork?${params}`);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          // window.open(url, "_blank"); // Opens generated artwork in a new tab
        }}
            className="text-black underline text-sm font-videocond font-light hover:text-gray-700"
            type="button"
          >
            Connect external wallet
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Collect (mint)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-8 flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 focus:outline-none"
          aria-label="Close"
        >
          <img src="/images/close_square.svg" alt="Close" className="w-6 h-6" />
        </button>
        {/* Header */}
        <h2 className="font-videocond font-bold text-3xl mb-4 text-center">READY TO MAKE HISTORY?</h2>
        {/* Body */}
        <p className="font-videocond font-bold text-lg text-center mb-2">
          You're about to create a one-of-a-kind generative poster.
        </p>
        <p className="font-videocond font-light text-lg text-center mb-6">
          This is your onchain signature of support for a better Internet – permanent, verifiable, and uniquely yours.
        </p>
        {/* Loading gif */}
        <div className="mb-6">
          <img src="/images/loading-yellow.gif" alt="Loading generative art" className="w-40 h-40 object-contain mx-auto" />
        </div>
        {/* Collect Now button */}
        <button
          onClick={() => onCollect && onCollect(name || ensName || walletAddress)}
          className="bg-black text-white rounded-full px-8 py-2 font-videocond font-bold text-lg hover:bg-gray-900 transition"
          disabled={minting}
        >
          {minting ? "Please wait..." : "SIGN AND COLLECT"}
        </button>
      </div>
    </div>
  );
} 