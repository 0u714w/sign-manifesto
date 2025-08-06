import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-4">Could not find the requested resource.</p>
      <Link
        href="/"
        className="border-2 border-black rounded-full px-4 py-2 font-videocond text-lg font-bold bg-white text-black hover:bg-black hover:text-white transition cursor-pointer"
      >
        Return Home
      </Link>
    </div>
  );
} 