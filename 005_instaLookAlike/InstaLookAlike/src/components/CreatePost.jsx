/**
 * CreatePost Component
 * 
 * Deze component biedt een formulier voor het maken van nieuwe posts.
 * Het ondersteunt het uploaden van afbeeldingen en het toevoegen van een beschrijving.
 * 
 * Functionaliteiten:
 * 1. Afbeelding upload met preview
 * 2. Bestandsvalidatie (grootte en type)
 * 3. Beschrijving toevoegen
 * 4. Formulier validatie
 * 5. Upload status en foutafhandeling
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreatePost({ user }) {
  // State management voor formulier en upload status
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * Handler voor het selecteren van een afbeelding
   * Valideert bestandsgrootte en type
   * Genereert een preview van de geselecteerde afbeelding
   * 
   * @param {Event} e - File input change event
   */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validatie van bestandsgrootte (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('De afbeelding mag niet groter zijn dan 5MB');
        return;
      }

      // Validatie van bestandstype
      if (!file.type.startsWith('image/')) {
        setError('Alleen afbeeldingen zijn toegestaan');
        return;
      }

      setImage(file);
      setError('');
      
      // Preview genereren met FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handler voor het versturen van het formulier
   * Uploadt de afbeelding en caption naar de server
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Selecteer een afbeelding');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // FormData voorbereiden voor upload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('caption', caption);
      formData.append('user_id', user.id);

      // Upload request met JWT authenticatie
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan bij het maken van de post');
      }

      // Reset formulier en navigeer naar home
      setImage(null);
      setCaption('');
      setPreview('');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Nieuwe post maken</h2>

        {/* Foutmelding weergave */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Afbeelding upload sectie */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Afbeelding
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {preview ? (
                // Preview weergave met verwijder optie
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-96 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setPreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                // Upload interface
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Kies een afbeelding
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    Maximaal 5MB, alleen afbeeldingen
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Beschrijving input */}
          <div className="mb-6">
            <label htmlFor="caption" className="block text-gray-700 text-sm font-bold mb-2">
              Beschrijving
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Voeg een beschrijving toe..."
            />
          </div>

          {/* Submit knop */}
          <button
            type="submit"
            disabled={isLoading || !image}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Bezig met uploaden...' : 'Posten'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;
