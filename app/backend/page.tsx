'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UploadedFile {
  name: string;
  url: string;
  folder: string;
}

export default function BackendPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [folder, setFolder] = useState('logos');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('foldr_logged_in');
    setIsLoggedIn(loggedIn === 'true');
    
    // Load previously uploaded files from localStorage
    const saved = localStorage.getItem('foldr_uploads');
    if (saved) {
      setUploadedFiles(JSON.parse(saved));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) return;

    setUploading(true);
    setMessage('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          data: preview,
          folder: folder,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ Uploaded: ${data.url}`);
        const newFile: UploadedFile = {
          name: data.filename,
          url: data.url,
          folder: folder,
        };
        const updated = [...uploadedFiles, newFile];
        setUploadedFiles(updated);
        localStorage.setItem('foldr_uploads', JSON.stringify(updated));
        setSelectedFile(null);
        setPreview(null);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('❌ Upload failed');
    }

    setUploading(false);
  };

  const deleteFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    localStorage.setItem('foldr_uploads', JSON.stringify(updated));
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setMessage('📋 URL copied!');
    setTimeout(() => setMessage(''), 2000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Please log in first</p>
          <Link href="/" className="text-slate-400 hover:underline">Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-zinc-400 hover:text-white text-2xl">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Backend</h1>
          <p className="text-zinc-500 text-sm">Upload logos & images</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-6">
        <h2 className="font-semibold text-zinc-300 mb-4">Upload New Image</h2>
        
        {/* Folder Selection */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400 block mb-2">Folder</label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="logos">Logos</option>
            <option value="icons">Icons</option>
            <option value="backgrounds">Backgrounds</option>
            <option value="screenshots">Screenshots</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* File Input */}
        <div className="mb-4">
          <label className="text-sm text-zinc-400 block mb-2">Select Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-white text-slate-900 file:text-white file:cursor-pointer"
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-4">
            <p className="text-sm text-zinc-400 mb-2">Preview</p>
            <div className="bg-zinc-800 rounded-lg p-4 flex items-center justify-center">
              <img src={preview} alt="Preview" className="max-h-48 max-w-full rounded" />
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full bg-white hover:bg-slate-100 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>

        {/* Message */}
        {message && (
          <p className="mt-3 text-sm text-center">{message}</p>
        )}
      </div>

      {/* Uploaded Files */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <h2 className="font-semibold text-zinc-300 mb-4">Uploaded Files ({uploadedFiles.length})</h2>
        
        {uploadedFiles.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No files uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="bg-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <img 
                  src={file.url} 
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-zinc-500">{file.folder}</p>
                </div>
                <button
                  onClick={() => copyUrl(file.url)}
                  className="text-slate-400 hover:text-slate-300 p-2"
                  title="Copy URL"
                >
                  📋
                </button>
                <button
                  onClick={() => deleteFile(index)}
                  className="text-red-400 hover:text-red-300 p-2"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
        <p className="text-xs text-zinc-500">
          <strong className="text-zinc-400">Note:</strong> Files are stored in <code className="bg-zinc-800 px-1 rounded">public/uploads/</code>. 
          On Vercel, uploads won&apos;t persist between deployments. For permanent storage, use a service like Cloudinary or AWS S3.
        </p>
      </div>
    </div>
  );
}


