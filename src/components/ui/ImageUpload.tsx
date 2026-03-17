import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  currentUrl?: string | null;
  userId: string;
  onUploaded: (url: string | null) => void;
  label?: string;
  /** Shape of the preview: 'circle' for group/user avatars, 'rect' for meetup banners */
  shape?: 'circle' | 'rect';
}

export function ImageUpload({ currentUrl, userId, onUploaded, label = 'Add photo', shape = 'rect' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch {
      setError('Upload failed. Make sure the "images" storage bucket exists in Supabase.');
    } finally {
      setUploading(false);
    }
  }

  const previewClass = shape === 'circle'
    ? 'w-20 h-20 rounded-full'
    : 'w-full h-32 rounded-2xl';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-[0.8125rem] font-medium text-[#6B6B6B]">{label}</span>
      )}

      <div className="flex items-center gap-3">
        {/* Preview */}
        <div
          className={`${previewClass} bg-[#EBF0E6] overflow-hidden flex items-center justify-center shrink-0 relative`}
        >
          {currentUrl ? (
            <>
              <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onUploaded(null)}
                aria-label="Remove image"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[rgba(0,0,0,0.5)] flex items-center justify-center text-white hover:bg-[rgba(0,0,0,0.7)] transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <Camera size={20} strokeWidth={1.75} className="text-[#9E9E9E]" />
          )}
        </div>

        {/* Upload button */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="
              px-4 py-2 rounded-full text-[0.8125rem] font-medium
              border border-[#A4BC91] text-[#5C8348] bg-transparent
              hover:bg-[#F2F5EE] transition-colors
              disabled:opacity-40 disabled:pointer-events-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C8348]
            "
          >
            {uploading ? 'Uploading…' : currentUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {error && (
            <p className="text-[0.75rem] text-[#F44336]">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        aria-label="Choose image"
      />
    </div>
  );
}
