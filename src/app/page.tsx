"use client";
import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import SignManifestoModal from "@/components/SignManifestoModal";
import { ethers } from "ethers";
import ManifestoMinterABI from "@/lib/ManifestoMinterABI.json";
import { useRouter } from "next/navigation";

export default function Home() {
  const { login, authenticated, user, linkWallet, logout } = usePrivy();
  const [modalOpen, setModalOpen] = useState(false);
  const [ensName, setEnsName] = useState<string>("");
  const [signerNumber, setSignerNumber] = useState<number | undefined>(undefined);
  const [minting, setMinting] = useState(false);
  const router = useRouter();

  // ENS lookup after login
  useEffect(() => {
    async function fetchENS() {
      if (authenticated && user?.wallet?.address) {
        try {
          const provider = new ethers.AlchemyProvider("mainnet", process.env.NEXT_PUBLIC_ALCHEMY_KEY);
          console.log("Looking up ENS for address:", user.wallet.address);
          let name = await provider.lookupAddress(user.wallet.address);
          console.log("Mainnet ENS result:", name);
          if (!name) {
            try {
              const baseProvider = new ethers.AlchemyProvider("base-mainnet", process.env.NEXT_PUBLIC_ALCHEMY_KEY);
              name = await baseProvider.lookupAddress(user.wallet.address);
              console.log("Base ENS result:", name);
            } catch (e) {
              console.error("Base ENS lookup error:", e);
            }
          }
          setEnsName(name || "");
        } catch (e) {
          console.error("ENS lookup error:", e);
          setEnsName("");
        }
      }
    }
    fetchENS();
  }, [authenticated, user]);

  // Open modal automatically after login
  useEffect(() => {
    if (authenticated) {
      setModalOpen(true);
    }
  }, [authenticated]);

  const handleSign = (name: string) => {
    // TODO: Replace with real backend/contract call to get signer number
    setSignerNumber(42); // Simulated signer number
    // Do NOT close the modal or show alert here!
  };

  const handleConnectWallet = () => {
    linkWallet?.();
  };

  const handleCollect = async (name: string) => {
    setMinting(true);
    try {
      const contractAddress = "0x01bD58aC51B1F8fC8d086C6564d2Dd9f4cA9A2Fe";
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, ManifestoMinterABI, signer);

      // Call mint (pass empty string for signatureHash if not used)
      const tx = await contract.mint(name, "");
      const receipt = await tx.wait();

      // Find ManifestoSigned event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e && e.name === "ManifestoSigned");

      if (!event) {
        alert("Mint succeeded but event not found. Please check the explorer.");
        return;
      }

      const tokenId = event.args.tokenId.toString();
      const transactionHash = receipt.hash;

      // Pass data to reveal page (via router, state, or context)
      // Make sure user.wallet.address is available
      const walletAddress = user?.wallet?.address || "";
      router.push(
        `/reveal/${tokenId}?name=${encodeURIComponent(name)}&tx=${transactionHash}&wallet=${walletAddress}`
      );
    } catch (err) {
      alert("Mint failed: " + (err as Error).message);
    } finally {
      setMinting(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-8 md:pt-24 justify-start md:justify-center">
      <div className="text-center space-y-4 w-full md:max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-videocond font-bold mb-2 md:mb-4 text-black drop-shadow-lg">SIGN THE MANIFESTO</h1>
        <p className="mx-auto md:max-w-3xl text-lg md:text-2xl mb-1 px-6 md:px-0 text-black drop-shadow-lg">
          Add your name to join the movement and unlock new colors.
          Sign onchain to collect your own unique piece of generative art.
        </p>
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              if (!authenticated) login();
              else setModalOpen(true);
            }}
            className="border-2 border-black rounded-full px-5 py-2 font-videocond text-lg md:text-2xl hover:bg-black hover:text-white transition mt-4 cursor-pointer bg-white text-black shadow-lg"
          >
            SIGN FOR FREE
          </button>
          {authenticated && (
            <button
              onClick={logout}
              className="mt-2 text-black underline text-sm md:text-base font-videocond font-light hover:text-gray-700 cursor-pointer drop-shadow-lg"
              type="button"
            >
              Logout
            </button>
          )}
        </div>
      </div>
      <div className="mt-8 mb-12 flex justify-center">
        <img
          src="/images/manifestooutputs.gif"
          alt="Manifesto Art"
          className="w-full max-w-md md:max-w-2xl mx-auto shadow-lg rounded-lg overflow-hidden"
        />
      </div>
      <SignManifestoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSign={handleSign}
        onConnectWallet={handleConnectWallet}
        ensName={ensName}
        onCollect={handleCollect}
        minting={minting}
      />
    </main>
  );
}
