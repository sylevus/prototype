'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../services/api';
import MarkdownDisplay from '../../components/MarkdownDisplay';

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
    type: 'action' | 'narrative' | 'dm';
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
  const [isSessionStarted, setIsSessionStarted] = useState(false);

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
            // Try to parse as JSON first (for conversation history)
            const parsedBackstory = JSON.parse(data.backstory);
            setConversation(Array.isArray(parsedBackstory) ? parsedBackstory : []);
          } catch (e) {
            // If parsing fails, treat it as a plain text backstory
            console.log('Backstory is plain text, not conversation history');
            setConversation([{
              sender: 'ai',
              text: data.backstory
            }]);
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

  const handleStartSession = async () => {
    if (!session) return;

    try {
      const result = await api.startDmSession(session.sessionId);
      
      // Add the narrative and DM notes to the history
      const narrativeEvent: NarrativeEvent = {
        type: 'narrative',
        content: result.narrative,
        timestamp: new Date()
      };
      
      const dmEvent: NarrativeEvent = {
        type: 'dm',
        content: result.dmNotes,
        timestamp: new Date()
      };

      setNarrativeHistory([narrativeEvent, dmEvent]);
      setIsSessionStarted(true);
      
      // Update session summary
      setSession(prev => prev ? {
        ...prev,
        summary: result.narrative
      } : null);
    } catch (err: any) {
      setError(`Failed to start session: ${err.message}`);
    }
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
    <div className="flex h-[calc(100vh-100px)] bg-black overflow-hidden">
      {/* Main Content - Use full calculated height */}
      <div className="flex flex-1 min-h-0 bg-black">
        {/* Left Panel: Game Interaction - Optimized height usage */}
        <div className="w-2/3 p-4 flex flex-col min-h-0">
          {/* Game Area - Takes most of the height */}
          <div className="flex-1 chrome-surface rounded-2xl p-4 mb-3 min-h-0 flex flex-col">
            {/* Character indicator at top */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-samuel-bright-red to-samuel-dark-red flex items-center justify-center">
                  <svg className="w-4 h-4 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
                    {character?.name}
                  </h2>
                  <p className="text-xs text-samuel-off-white/60">Adventure Session</p>
                </div>
              </div>
              {isSessionStarted && (
                <div className="text-xs text-samuel-off-white/50 flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Active</span>
                </div>
              )}
            </div>

            {!isSessionStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-samuel-bright-red to-samuel-dark-red flex items-center justify-center">
                    <svg className="w-8 h-8 text-samuel-off-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-4v4h2v-4m-2 0V9a1 1 0 011-1h2a1 1 0 011 1v1m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-samuel-off-white text-lg mb-4">Ready to begin your adventure?</p>
                  <button
                    onClick={handleStartSession}
                    className="chrome-button px-8 py-3 text-samuel-off-white text-lg"
                  >
                    Begin Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {narrativeHistory.map((event, index) => (
                  <div 
                    key={index} 
                    className={`chrome-card p-4 ${
                      event.type === 'action' ? 'border-l-4 border-samuel-bright-red' : 
                      event.type === 'dm' ? 'border-l-4 border-samuel-dark-teal bg-samuel-dark-teal/10' : 
                      'border-l-4 border-samuel-off-white/20'
                    }`}
                  >
                    {event.type === 'action' && (
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-samuel-bright-red flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="font-semibold text-samuel-bright-red">{event.content}</p>
                      </div>
                    )}
                    {event.type === 'narrative' && (
                      <MarkdownDisplay content={event.content} />
                    )}
                    {event.type === 'dm' && (
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-samuel-dark-teal flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <MarkdownDisplay 
                            content={event.content} 
                            className="text-samuel-off-white/90 italic [&_p]:text-samuel-off-white/90 [&_p]:italic"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Input Area - Fixed at bottom with guaranteed visibility */}
          {isSessionStarted && (
            <div className="shrink-0 mt-3 bg-black p-2 rounded-xl border border-white/10">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAction()}
                  className="flex-1 chrome-input p-3 text-samuel-off-white placeholder-samuel-off-white/50 text-base"
                  placeholder="What do you do?"
                />
                <button 
                  onClick={handleSubmitAction}
                  className="chrome-button px-6 py-3 text-samuel-off-white shrink-0 text-base"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Action
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Character Sheet - Optimized height */}
        <div className="w-1/3 p-4 flex flex-col min-h-0">
          <div className="chrome-surface rounded-2xl p-4 flex flex-col flex-1 min-h-0">
            {/* Header - Fixed */}
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h2 className="text-lg font-semibold text-samuel-off-white">Character Sheet</h2>
              {isEditing ? (
                <button 
                  onClick={handleSaveSheet}
                  className="chrome-button px-4 py-2 text-sm text-samuel-off-white"
                >
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </span>
                </button>
              ) : (
                <button 
                  onClick={handleEditClick}
                  className="chrome-button px-4 py-2 text-sm text-samuel-off-white"
                >
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </span>
                </button>
              )}
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 min-h-0">
              {isEditing ? (
                <textarea
                  value={editableSheet}
                  onChange={(e) => setEditableSheet(e.target.value)}
                  className="w-full h-full chrome-input text-samuel-off-white p-3 resize-none text-sm leading-relaxed"
                  placeholder="Enter character sheet details..."
                />
              ) : (
                <div className="h-full overflow-y-auto pr-2">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-samuel-off-white">
                    {characterSheet}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
