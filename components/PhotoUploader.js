'use client';

import { useState } from 'react';
import { supabase } from '@/libs/supabaseClient';

export default function PhotoUploader({ guideId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setUploading(true);
    setMessage('');

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${guideId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-guide-photos')
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        setMessage('Error al subir una foto.');
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('service-guide-photos')
        .getPublicUrl(fileName);

      await supabase.from('service_guide_photos').insert({
        guide_id: guideId,
        photo_url: publicUrlData.publicUrl,
        photo_path: fileName,
      });
    }

    setUploading(false);
    setMessage('Foto(s) subida(s) correctamente.');
    if (onUploaded) onUploaded();
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-2">
        Fotos del servicio
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Puedes tomar fotos directamente desde el celular o subir imágenes existentes.
      </p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleUpload}
        className="block w-full text-sm"
      />

      {uploading && (
        <p className="text-sm text-blue-600 mt-3">Subiendo fotos...</p>
      )}

      {message && (
        <p className="text-sm text-slate-600 mt-3">{message}</p>
      )}
    </div>
  );
}