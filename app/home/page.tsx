'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';

interface Character {
  characterId: number;
  name: string;
  // Add other properties as needed
}

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const data = await api.get('characters');
        setCharacters(data);
      } catch (error) {
        console.error(error);
        router.push('/'); // Redirect to login on error (e.g., expired token)
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const handleSelectCharacter = async (characterId: number) => {
    try {
      await api.post(`session/character/${characterId}`, {});
      router.push(`/session/${characterId}`);
    } catch (error) {
      console.error('Error selecting character:', error);
      alert('Could not start a session for this character.');
    }
  };

  return (
    <div className="flex flex-col items-center w-full flex-grow pt-10">
      <div className="text-center bg-black bg-opacity-50 p-10 rounded-lg">
        <h1 className="text-5xl font-bold text-white mb-8">Your Characters</h1>
        
        {isLoading ? (
          <p className="text-white">Loading characters...</p>
        ) : (
          <div className="space-y-4 mb-8">
            {characters.length > 0 ? (
              characters.map(char => (
                <button 
                  key={char.characterId} 
                  onClick={() => handleSelectCharacter(char.characterId)}
                  className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  {char.name}
                </button>
              ))
            ) : (
              <p className="text-gray-400">You have not created any characters yet.</p>
            )}
          </div>
        )}

        <Link href="/character-creation">
          <button 
            className="w-full font-bold py-3 px-6 rounded-lg text-white"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            Create New Character
          </button>
        </Link>
      </div>
    </div>
  );
}
