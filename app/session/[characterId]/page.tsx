'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../services/api';

interface Message {
  sender: string;
  text: string;
}

interface Session {
  sessionId: string;
  characterId: number;
  summary: string;
  narrativeDirection: string;
}

interface NarrativeEvent {
    type: 'action' | 'narrative';
    content: string;
    timestamp?: Date;
}

interface Character {
  characterId: number;
  name: string;
  backstory: string;
  characterSheet: string;
  createdAt: string;
  updatedAt: string;
  playerId: number;
}

export default function SessionPage() {
  const params = useParams();
  const characterId = params.characterId;

  const [character, setCharacter] = useState<Character | null>(null);
      const [characterSheet, setCharacterSheet] = useState('');
  const [isEditing, setIsEditing] = useState(false);
    const [editableSheet, setEditableSheet] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [narrativeHistory, setNarrativeHistory] = useState<NarrativeEvent[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;

    const fetchSessionData = async (charId: string) => {
      try {
        const sessionData = await api.post(`session/character/${charId}`, {});
        setSession(sessionData);
        // Initialize with the session summary
        if (sessionData.summary) {
          setNarrativeHistory([{ 
            type: 'narrative', 
            content: sessionData.summary,
            timestamp: new Date()
          }]);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchCharacterData = async () => {
      try {
        const data = await api.get(`character/${characterId}`);
        setCharacter(data);
        setCharacterSheet(data.characterSheet || 'No character sheet available.');
        
        // Only try to parse backstory if it exists
        if (data.backstory) {
          try {
            const parsedBackstory = JSON.parse(data.backstory);
            setConversation(Array.isArray(parsedBackstory) ? parsedBackstory : []);
          } catch (e) {
            console.error('Failed to parse backstory:', e);
            setConversation([]);
          }
        }
        
        await fetchSessionData(characterId as string);
      } catch (err: any) {
        setError(`Failed to load character: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacterData();
  }, [characterId]);

  const handleSaveSheet = async () => {
    if (!character) return;

    try {
      await api.put(`character/${character.characterId}/sheet`, { characterSheet: editableSheet });
      setCharacterSheet(editableSheet);
      setIsEditing(false);
    } catch (err: any) {
      setError(`Failed to save character sheet: ${err.message}`);
    }
  };

  const handleSubmitAction = async () => {
    if (!playerInput.trim() || !session) return;

    const newAction: NarrativeEvent = { 
      type: 'action', 
      content: playerInput,
      timestamp: new Date()
    };
    setNarrativeHistory(prev => [...prev, newAction]);

    try {
      const result = await api.post('submit', { 
        input: playerInput, 
        sessionId: session.sessionId,
        sessionSummary: session.summary
      });
      
      const newNarrative: NarrativeEvent = { 
        type: 'narrative', 
        content: result.Narrative,
        timestamp: new Date()
      };
      setNarrativeHistory(prev => [...prev, newNarrative]);
      
      // Update session summary with the latest narrative
      setSession(prev => prev ? {
        ...prev,
        summary: result.Narrative
      } : null);
      
    } catch (err: any) {
      const errorNarrative: NarrativeEvent = { 
        type: 'narrative', 
        content: `Error: ${err.message}`,
        timestamp: new Date()
      };
      setNarrativeHistory(prev => [...prev, errorNarrative]);
    } finally {
      setPlayerInput('');
    }
  };

  const handleEditClick = () => {
    setEditableSheet(characterSheet);
    setIsEditing(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading session...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-black text-red-500">Error: {error}</div>;
  }

  if (!character) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Character not found.</div>;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
            {/* Left Panel: Game Interaction */}
      <div className="w-2/3 p-4 flex flex-col">
        <div className="flex-grow bg-black rounded-lg p-4 mb-4">
                    {narrativeHistory.map((event, index) => (
            <div key={index} className={`mb-4 ${event.type === 'action' ? 'text-blue-300' : 'text-gray-300'}`}>
              {event.type === 'action' && <p className="font-bold mb-1">{'>'} {event.content}</p>}
              {event.type === 'narrative' && <p>{event.content}</p>}
            </div>
          ))}
        </div>
        <div className="flex">
                    <input 
            type="text" 
            value={playerInput}
            onChange={(e) => setPlayerInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitAction()}
            className="flex-grow p-2 rounded-l-lg bg-gray-800 text-white focus:outline-none"
            placeholder="What do you do?"
          />
          <button 
            onClick={handleSubmitAction}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
          >
            Submit Action
          </button>
        </div>
      </div>

      {/* Right Panel: Character Sheet */}
      <div className="w-1/3 bg-gray-800 p-4 overflow-y-auto border-l border-gray-700">
        <h1 className="text-3xl font-bold mb-4">{character.name}</h1>
                <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Character Sheet</h2>
            {isEditing ? (
                <button 
                    onClick={handleSaveSheet}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                >
                    Save
                </button>
            ) : (
                <button 
                    onClick={handleEditClick}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm"
                >
                    Edit
                </button>
            )}
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
            {isEditing ? (
                <textarea
                    value={editableSheet}
                    onChange={(e) => setEditableSheet(e.target.value)}
                    className="w-full h-96 bg-gray-900 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div className="whitespace-pre-wrap">
                    {characterSheet}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
