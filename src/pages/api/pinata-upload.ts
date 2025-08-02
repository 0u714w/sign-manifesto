import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File as FormidableFile } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("API route hit", req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!pinataJWT) {
    console.log("Pinata JWT not configured");
    return res.status(500).json({ error: 'Pinata JWT not configured' });
  }

  // Parse the incoming form data
  const form = new formidable.IncomingForm();
  form.parse(req, async (err: any, fields: formidable.Fields, files: formidable.Files) => {
    if (err) {
      console.log("Formidable error:", err);
      return res.status(500).json({ error: 'Error parsing form data', details: err });
    }
    const file = files.file as FormidableFile | FormidableFile[] | undefined;
    if (!file) {
      console.log("No file uploaded in form data");
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileObj = Array.isArray(file) ? file[0] : file;
    if (!fileObj.filepath) {
      console.log("File object missing filepath", fileObj);
      return res.status(400).json({ error: 'File object missing filepath', fileObj });
    }
    console.log("File received:", fileObj.originalFilename, fileObj.filepath);
    const fileStream = fs.createReadStream(fileObj.filepath);
    const formData = new FormData();
    formData.append('file', fileStream, fileObj.originalFilename || 'upload.png');

    // Forward to Pinata
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });
      const text = await response.text();
      console.log('Pinata response status:', response.status);
      console.log('Pinata response body:', text);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'Invalid JSON from Pinata', raw: text };
      }
      res.status(response.status).json(data);
    } catch (e) {
      console.log("Error uploading to Pinata:", e);
      res.status(500).json({ error: 'Error uploading to Pinata', details: e });
    }
  });
} 