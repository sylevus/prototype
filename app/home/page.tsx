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

  const handleDeleteCharacter = async (characterId: number, characterName: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${characterName}"?\n\nThis will permanently delete:\n• The character\n• All adventure sessions\n• All game logs and history\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      await api.delete(`character/${characterId}`);
      // Refresh the character list
      const data = await api.get('characters');
      setCharacters(data);
    } catch (error) {
      console.error('Error deleting character:', error);
      alert(`Failed to delete character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col items-center w-full flex-grow p-8">
      <div className="chrome-card text-center p-10 w-full max-w-4xl">
        <div className="mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent mb-4">
            Your Characters
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-samuel-bright-red to-samuel-dark-red mx-auto rounded-full"></div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-samuel-bright-red border-t-transparent"></div>
            <p className="text-samuel-off-white ml-4 text-lg">Loading characters...</p>
          </div>
        ) : (
          <div className="grid gap-6 mb-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {characters.length > 0 ? (
              characters.map(char => (
                <div 
                  key={char.characterId} 
                  onClick={() => handleSelectCharacter(char.characterId)}
                  className="chrome-surface p-6 cursor-pointer transition-all duration-300 hover:scale-105 text-left group relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteCharacter(char.characterId, char.name, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 hover:border-red-500/60 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    title={`Delete ${char.name}`}
                  >
                    <svg className="w-4 h-4 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-samuel-bright-red to-samuel-dark-red flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-samuel-off-white group-hover:text-samuel-bright-red transition-colors">
                      {char.name}
                    </h3>
                  </div>
                  <div className="space-y-2 text-samuel-off-white/70">
                    <p className="flex justify-between">
                      <span>Class:</span> 
                      <span className="font-semibold text-samuel-off-white">{char.class}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Level:</span> 
                      <span className="font-semibold text-samuel-bright-red">{char.level}</span>
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-sm text-samuel-off-white/50 group-hover:text-samuel-bright-red/70 transition-colors">
                      Click to continue adventure →
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-samuel-dark-red/20 to-samuel-darker-red/20 flex items-center justify-center border-2 border-dashed border-samuel-bright-red/30">
                  <svg className="w-12 h-12 text-samuel-bright-red/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-samuel-off-white/60 text-lg">You have not created any characters yet.</p>
                <p className="text-samuel-off-white/40 text-sm mt-2">Start your adventure by creating your first character!</p>
              </div>
            )}
          </div>
        )}

        <Link href="/character-creation">
          <button className="chrome-button py-4 px-12 text-lg text-samuel-off-white w-full sm:w-auto">
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Character
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
}
