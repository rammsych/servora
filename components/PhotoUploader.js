'use client';

import { useState } from 'react';
import { supabase } from '@/libs/supabaseClient';

export default function PhotoUploader({ guideId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    if (!description.trim()) {
      setMessage('Debes ingresar una descripción antes de subir la fotografía.');
      e.target.value = '';
      return;
    }

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
        description: description.trim(),
      });
    }

    setUploading(false);
    setMessage('Foto(s) subida(s) correctamente.');
    setDescription('');

    if (onUploaded) onUploaded();

    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-2">
        Fotos del servicio
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Ingresa una descripción obligatoria antes de subir cada fotografía.
      </p>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción obligatoria de la fotografía"
        rows={3}
        className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500"
      />

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