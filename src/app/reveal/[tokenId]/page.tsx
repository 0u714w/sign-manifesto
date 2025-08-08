"use client";
import { useParams, useSearchParams } from "next/navigation";
import GenerativeArt from "@/components/GenerativeArt";
import { useEffect, useState, useRef } from "react";
import { create } from '@web3-storage/w3up-client';
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
  const [zineModalOpen, setZineModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showHiddenArtwork, setShowHiddenArtwork] = useState(false);
  const [uploadAttempted, setUploadAttempted] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const uploadInitiatedRef = useRef(false);
  const [artworkRendered, setArtworkRendered] = useState(false);

  // Parse tokenId from params
  const signerNumber = Number(params?.tokenId);

  useEffect(() => {
    const addr = searchParams?.get("wallet") || "";
    setWalletAddress(addr);
  }, [searchParams]);

  // Fetch onchain date from contract
  useEffect(() => {
    if (!signerNumber || isNaN(signerNumber)) return;
    async function fetchTimestamp() {
      console.log("signerNumber:", signerNumber);
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
          setDate(new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }));
        }
      } catch (error) {
        console.error("Error fetching token metadata:", error);
        setDate(new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }));
      }
    }
    fetchTimestamp();
  }, [signerNumber]);

  const truncateAddress = (addr: string) =>
    addr ? `0x${addr.slice(2, 5)}...${addr.slice(-5)}` : "";

  // Upload to IPFS and set token URI
  useEffect(() => {
    if (date && name && signerNumber && signature && !uploaded && !uploadAttempted && !uploadInProgress && !uploadInitiatedRef.current && artworkRendered) {
      uploadInitiatedRef.current = true;
      setUploadAttempted(true);
      setUploadInProgress(true);
      const displayName = name || truncateAddress(walletAddress);
      console.log("Preparing to upload:", { displayName, date, signerNumber, signature });
      setUploading(true);
      
      const uploadAndSetTokenURI = async () => {
        try {
          // Replace with your actual email and space DID
          const email = 'debsoonwy@gmail.com';
          const spaceDid = 'did:key:z6MktTWQLUtfwCGwCS8HvZxvD5MX2bb11iZqxFx1ewKFEjns';
          console.log('Creating IPFS client...');
          const client = await create();
          console.log('IPFS client created, logging in...');
          await client.login(email);
          console.log('Logged in to IPFS, setting current space...');
          await client.setCurrentSpace(spaceDid);
          console.log('Current space set, preparing for upload...');
          
          // Wait for canvas to be ready
          const waitForCanvas = () => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              console.log("Canvas found, proceeding with upload...");
              performUpload(canvas);
            } else {
              console.log("Canvas not ready, retrying...");
              setTimeout(waitForCanvas, 100);
            }
          };
          
          const performUpload = async (canvas: HTMLCanvasElement) => {
            try {
              // Convert canvas to blob
              console.log("Converting canvas to blob...");
              const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
              if (!blob) {
                setUploading(false);
                setUploadInProgress(false);
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
              
              const ipfsArtworkUrl = `ipfs://${artworkCid}/artwork.png`;
              const metadataUrl = `ipfs://${metadataCid}/metadata.json`;
              console.log('Artwork IPFS URL:', ipfsArtworkUrl);
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
                }
              } catch (err) {
                console.error('Error updating token URI:', err);
              }
              
              setUploading(false);
              setUploaded(true);
              setUploadInProgress(false);
            } catch (error) {
              console.error('Error in upload process:', error);
              setUploading(false);
              setUploadInProgress(false);
            }
          };
          
          // Start waiting for canvas
          waitForCanvas();
        } catch (error) {
          console.error('Error in IPFS upload process:', error);
          setUploading(false);
          setUploadInProgress(false);
        }
      };
      uploadAndSetTokenURI();
    }
  }, [date, name, signerNumber, signature, uploaded, uploadAttempted, uploadInProgress, artworkRendered, walletAddress]);

  const handleDownloadForPrint = async () => {
    setIsDownloading(true);
    setShowHiddenArtwork(true);
    
    // Wait for the hidden artwork to be ready
    const checkHiddenArtworkReady = () => {
      const hiddenCanvas = document.querySelector('.hidden-artwork canvas') as HTMLCanvasElement;
      if (hiddenCanvas) {
        // Hidden artwork is ready, capture and download
        hiddenCanvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            alert('Failed to generate download image.');
            cleanup();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "manifesto-artwork.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          cleanup();
        }, "image/png");
      } else {
        // Check again in 100ms
        setTimeout(checkHiddenArtworkReady, 100);
      }
    };
    
    const cleanup = () => {
      setIsDownloading(false);
      setShowHiddenArtwork(false);
    };
    
    // Start checking after a short delay
    setTimeout(checkHiddenArtworkReady, 100);
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
        <div className="font-videocond font-bold text-2xl md:text-4xl mb-4 text-black">{name || truncateAddress(walletAddress)}</div>
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
            className="border-2 border-black rounded-full px-3 md:px-4 py-1 md:py-2 font-videocond text-lg md:text-xl font-bold bg-white text-black hover:bg-black hover:text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownloadForPrint}
            disabled={isDownloading}
          >
            {isDownloading ? "Please wait..." : "DOWNLOAD FOR PRINT"}
          </button>
          <button
            className="border-2 border-black rounded-full px-3 md:px-4 py-1 md:py-2 font-videocond text-lg md:text-xl font-bold bg-white text-black hover:bg-black hover:text-white transition cursor-pointer"
            onClick={() => setZineModalOpen(true)}
          >
            GET ZINE BY MAIL
          </button>
        </div>
      </div>
      
      {artworkLoading && !isDownloading ? (
        <div className="text-center mt-8 md:mt-12">
          <img src="/images/loading-black2.gif" alt="Loading" className="w-32 h-32 mx-auto mb-4" />
          <div className="font-videocond text-xl md:text-2xl">Generating artwork...</div>
        </div>
      ) : null}
      
      <div className="mt-8 mb-6 md:mb-12 flex justify-center">
        <div className="w-full max-w-md md:max-w-2xl mx-auto shadow-lg rounded-lg overflow-hidden artwork-display">
          <GenerativeArt
            key={`${signerNumber}-${signature}`}
            name={name || truncateAddress(walletAddress)}
            date={date}
            signature={signature}
            signerNumber={signerNumber}
            background="paper"
            onArtworkReady={() => {
              setArtworkLoading(false);
              setArtworkRendered(true);
            }}
          />
        </div>
      </div>
      
      {/* Hidden artwork for download */}
      {showHiddenArtwork && (
        <div className="hidden-artwork" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <GenerativeArt
            key={`${signerNumber}-${signature}-white`}
            name={name || truncateAddress(walletAddress)}
            date={date}
            signature={signature}
            signerNumber={signerNumber}
            background="white"
            onArtworkReady={() => {
              // This callback is not needed for hidden artwork
            }}
          />
        </div>
      )}
      
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