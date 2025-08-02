"use client";
import { useParams, useSearchParams } from "next/navigation";
import GenerativeArt from "@/components/GenerativeArt";
import { useEffect, useState } from "react";
import { create } from '@web3-storage/w3up-client';
import { drawGenerativeArtToCanvas } from "@/components/GenerativeArt";
import ZineByMailModal from "@/components/ZineByMailModal";

export default function RevealPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const name = searchParams?.get("name") || "";
  const signature = searchParams?.get("tx") || "";
  const [walletAddress, setWalletAddress] = useState("");
  const [date, setDate] = useState("");
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [artworkLoading, setArtworkLoading] = useState(true);
  const [background, setBackground] = useState<'paper' | 'white'>('paper');
  const [zineModalOpen, setZineModalOpen] = useState(false);

  // Parse tokenId from params
  const signerNumber = Number(params?.tokenId);

  useEffect(() => {
    const addr = searchParams?.get("wallet") || "";
    setWalletAddress(addr);
  }, [searchParams]);

  // Fetch onchain date from contract
  useEffect(() => {
    async function fetchTimestamp() {
      console.log("signerNumber:", signerNumber);
      if (!signerNumber) return;
      
      try {
        const response = await fetch(`/api/get-token-metadata?tokenId=${signerNumber}`);
        const result = await response.json();
        
        if (response.ok && result.data.timestamp) {
          setDate(new Date(result.data.timestamp * 1000).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }));
        } else {
          console.log("No timestamp found for tokenId", signerNumber);
        }
      } catch (error) {
        console.error("Error fetching token metadata:", error);
      }
    }
    fetchTimestamp();
  }, [signerNumber]);

  const truncateAddress = (addr: string) =>
    addr ? `0x${addr.slice(2, 5)}...${addr.slice(-5)}` : "";

  const displayName = name || truncateAddress(walletAddress);

  useEffect(() => {
    if (date && displayName && signerNumber && signature && !uploaded) {
      console.log("Preparing to upload:", { displayName, date, signerNumber, signature });
      setUploading(true);
      const uploadAndSetTokenURI = async () => {
        // Replace with your actual email and space DID
        const email = 'debsoonwy@gmail.com'; // <-- Replace with your actual email
        const spaceDid = 'did:key:z6MktTWQLUtfwCGwCS8HvZxvD5MX2bb11iZqxFx1ewKFEjns';
        const client = await create();
        await client.login(email);
        await client.setCurrentSpace(spaceDid);
        setTimeout(async () => {
          const canvas = document.querySelector('canvas');
          console.log("Canvas found:", !!canvas, canvas);
          if (!canvas) {
            setUploading(false);
            return;
          }
          // Convert canvas to blob
          console.log("Converting canvas to blob...");
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (!blob) {
            setUploading(false);
            alert("Failed to convert canvas to image blob.");
            return;
          }
          // Prepare files for Storacha
          const artworkFile = new File([blob], 'artwork.png', { type: 'image/png' });
          
          // Upload both files together
          console.log("Uploading artwork and metadata to IPFS...");
          
          // Create metadata first
          interface Metadata {
            name: string;
            description: string;
            image?: string;
            attributes: Array<{
              trait_type: string;
              value: string;
            }>;
          }
          
          // Upload artwork first
          const artworkCid = await client.uploadDirectory([artworkFile]);
          console.log('Uploaded artwork CID:', artworkCid);
          
          // Create metadata with the artwork's CID
          const metadata: Metadata = {
            name: `Digital Maverick Manifesto #${signerNumber}`,
            description: `Your unique generative manifesto artwork, signed by ${displayName} on ${date}.`,
            image: `ipfs://${artworkCid}/artwork.png`,
            attributes: [
              { trait_type: "Signer", value: displayName },
              { trait_type: "Date", value: date },
              { trait_type: "Token ID", value: signerNumber.toString() },
              { trait_type: "Transaction Hash", value: signature }
            ]
          };
          
          // Create and upload metadata file
          const metadataFile = new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' });
          const metadataCid = await client.uploadDirectory([metadataFile]);
          console.log('Uploaded metadata CID:', metadataCid);
          
          const artworkUrl = `ipfs://${artworkCid}/artwork.png`;
          const metadataUrl = `ipfs://${metadataCid}/metadata.json`;
          console.log('Artwork IPFS URL:', artworkUrl);
          console.log('Metadata IPFS URL:', metadataUrl);

          // Update token URI via server-side API
          try {
            const response = await fetch('/api/update-token-uri', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tokenId: signerNumber,
                metadataUrl: metadataUrl
              }),
            });

            const result = await response.json();
            
            if (response.ok) {
              console.log('Token URI updated successfully:', result.transactionHash);
            } else {
              console.error('Failed to update token URI:', result.error);
              // Don't show alert to user, just log the error
            }
          } catch (err) {
            console.error('Error updating token URI:', err);
            // Don't show alert to user, just log the error
          }
          
          setUploading(false);
          setUploaded(true);
        }, 500);
      };
      uploadAndSetTokenURI();
    }
  }, [date, displayName, signerNumber, signature, uploaded]);

  const handleDownloadForPrint = async () => {
    setBackground('white');
    // Wait for the canvas to update
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "manifesto-artwork.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setBackground('paper');
      }, "image/png");
    }, 300); // Wait 300ms for re-render
  };

  const handleShareToX = async () => {
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        alert('Artwork not ready yet. Please wait for it to generate.');
        return;
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        alert('Failed to generate artwork image.');
        return;
      }

      // Create FormData for the image
      const formData = new FormData();
      formData.append('media', blob, 'manifesto-artwork.png');

      // Upload image to Twitter (you'll need to set up Twitter API)
      // For now, we'll use a simple approach with the text
      const shareText = "I just signed the Digital Maverick Manifesto. Written by @debsoon, but owned by everyone. Read and sign the manifesto at manifesto.digitalmavericks.xyz.";
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      
      window.open(shareUrl, '_blank');
    } catch (error) {
      console.error('Error sharing to X:', error);
      alert('Failed to share to X. Please try again.');
    }
  };

  const handleShareToFarcaster = async () => {
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        alert('Artwork not ready yet. Please wait for it to generate.');
        return;
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        alert('Failed to generate artwork image.');
        return;
      }

      // For Farcaster, we'll use the Warpcast share URL
      const shareText = "I just signed the Digital Maverick Manifesto. Written by @debbie, but owned by everyone. Read and sign the manifesto at manifesto.digitalmavericks.xyz.";
      const shareUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(shareText)}`;
      
      window.open(shareUrl, '_blank');
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
      alert('Failed to share to Farcaster. Please try again.');
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-4 pt-8 md:pt-24">
      <div className="text-center space-y-2 w-full md:max-w-3xl">
        <h1 className="font-videocond font-light text-3xl md:text-5xl mb-2 text-black">WELCOME TO THE REVOLUTION</h1>
        <div className="font-videocond font-bold text-2xl md:text-4xl mb-4 text-black">{displayName}</div>
        <p className="font-videocond font-light text-lg md:text-xl mb-2 text-black">
          This generative artwork is yours, and yours alone.<br />
          Download it, share it, and know you're part of something bigger.
        </p>
        <div className="flex items-center justify-center gap-4 my-4">
          <img 
            src="/images/xpixel.svg" 
            alt="Share to X" 
            className="w-7 h-7 cursor-pointer hover:opacity-70 transition" 
            onClick={handleShareToX}
          />
          <img 
            src="/images/fcpixel.svg" 
            alt="Share to Farcaster" 
            className="w-10 h-10 cursor-pointer hover:opacity-70 transition" 
            onClick={handleShareToFarcaster}
          />
        </div>
        <div className="flex flex-row gap-4 justify-center my-4">
          <button
            className="border-2 border-black rounded-full px-3 md:px-4 py-1 md:py-2 font-videocond text-lg md:text-xl font-bold bg-white text-black hover:bg-black hover:text-white transition cursor-pointer"
            onClick={handleDownloadForPrint}
          >
            DOWNLOAD FOR PRINT
          </button>
          <button
            className="border-2 border-black rounded-full px-3 md:px-4 py-1 md:py-2 font-videocond text-lg md:text-xl font-bold bg-white text-black hover:bg-black hover:text-white transition cursor-pointer"
            onClick={() => setZineModalOpen(true)}
          >
            GET ZINE BY MAIL
          </button>
        </div>
      </div>
      
      {artworkLoading && (
        <div className="mt-8 text-center">
          <img src="/images/loading-black2.gif" alt="Loading" className="w-48 h-48 mx-auto mb-4" />
          <div className="font-videocond text-xl md:text-2xl text-black">Generating artwork...</div>
        </div>
      )}
            <div className="mt-8 mb-6 md:mb-12 flex justify-center">
        <div className="w-full max-w-md md:max-w-2xl mx-auto shadow-lg rounded-lg overflow-hidden">
          <GenerativeArt
            key={`${signerNumber}-${signature}-${background}`}
            name={displayName}
            date={date}
            signature={signature}
            signerNumber={signerNumber}
            background={background}
            onArtworkReady={() => setArtworkLoading(false)}
          />
        </div>
      </div>
      {/* Uploading happens silently in the background */}
      
      
      <ZineByMailModal
        open={zineModalOpen}
        onClose={() => setZineModalOpen(false)}
        onSubmit={(data) => {
          // The modal now handles its own confirmation message
          setZineModalOpen(false);
        }}
      />
    </main>
  );
} 