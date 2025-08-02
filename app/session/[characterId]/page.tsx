'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../services/api';
import MarkdownDisplay from '../../components/MarkdownDisplay';
import LoadingSpinner from '../../components/LoadingSpinner';

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

interface Submission {
    submissionNumber: number;
    action: string;
    narrative: string;
    timestamp: Date;
}

interface Character {
  characterId: number;
  name: string;
  backstory: string;
  characterSheet: string;
  imageUrl?: string;
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [playerInput, setPlayerInput] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [currentSubmission, setCurrentSubmission] = useState(1);
  const [maxSubmissionsToKeep] = useState(4);

  useEffect(() => {
    if (!characterId) return;

    const fetchSessionData = async (charId: string) => {
      try {
        const sessionData = await api.post(`session/character/${charId}`, {});
        setSession(sessionData);
        
        // Try to load recent session history
        try {
          const historyData = await api.getSessionHistory(sessionData.sessionId, 5);
          if (historyData.submissions && historyData.submissions.length > 0) {
            // Convert history data to submissions format
            const historicalSubmissions = historyData.submissions.map((sub: any) => ({
              submissionNumber: sub.submissionNumber,
              action: sub.action,
              narrative: sub.narrative,
              timestamp: new Date(sub.timestamp)
            }));
            
            setSubmissions(historicalSubmissions);
            // Set current submission to the latest (most recent)
            setCurrentSubmission(historicalSubmissions.length);
            setIsSessionStarted(true); // Mark session as started if there's history
            
            console.log(`Loaded ${historicalSubmissions.length} historical submissions, set to latest (#${historicalSubmissions.length})`);
          } else {
            // No history found, initialize with session summary if available
            if (sessionData.summary) {
              setNarrativeHistory([{ 
                type: 'narrative', 
                content: sessionData.summary,
                timestamp: new Date()
              }]);
            }
          }
        } catch (historyErr: any) {
          console.log('No session history found, starting fresh:', historyErr.message);
          // Fallback to original behavior
          if (sessionData.summary) {
            setNarrativeHistory([{ 
              type: 'narrative', 
              content: sessionData.summary,
              timestamp: new Date()
            }]);
          }
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
    if (!playerInput.trim() || !session || isSubmittingAction) return;

    const currentInput = playerInput;
    setIsSubmittingAction(true);
    setPlayerInput('');

    try {
      const result = await api.submitPlayerAction(session.sessionId, currentInput);
      console.log('DM response received:', result);
      
      if (!result.narrative) {
        console.error('No narrative in response:', result);
        throw new Error('Invalid response: missing narrative');
      }
      
      // Create new submission
      const newSubmission: Submission = {
        submissionNumber: submissions.length + 1,
        action: currentInput,
        narrative: result.narrative,
        timestamp: new Date()
      };
      
      setSubmissions(prev => {
        // Keep only the last maxSubmissionsToKeep submissions
        const updated = [...prev, newSubmission].slice(-maxSubmissionsToKeep);
        console.log('Updated submissions:', updated);
        console.log('DM notes (internal only):', result.dmNotes);
        return updated;
      });
      
      // Auto-advance to latest submission
      setCurrentSubmission(Math.min(submissions.length + 1, maxSubmissionsToKeep));
      
      // Update session summary with the latest narrative
      setSession(prev => prev ? {
        ...prev,
        summary: result.narrative
      } : null);
      
    } catch (err: any) {
      console.error('Error in handleSubmitAction:', err);
      // For errors, still create a submission but with error content
      const errorSubmission: Submission = {
        submissionNumber: submissions.length + 1,
        action: currentInput,
        narrative: `Error: ${err.message}`,
        timestamp: new Date()
      };
      
      setSubmissions(prev => {
        const updated = [...prev, errorSubmission].slice(-maxSubmissionsToKeep);
        return updated;
      });
      
      setCurrentSubmission(Math.min(submissions.length + 1, maxSubmissionsToKeep));
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleEditClick = () => {
    setEditableSheet(characterSheet);
    setIsEditing(true);
  };

  const handleGenerateImage = async () => {
    if (!imageDescription.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    try {
      const result = await api.generateCharacterImage(imageDescription);
      setGeneratedImage(result.imageUrl);
    } catch (err: any) {
      setError(`Failed to generate image: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveImage = async () => {
    if (!generatedImage || !character) return;

    try {
      await api.saveCharacterImage(character.characterId, generatedImage);
      setCharacter(prev => prev ? { ...prev, imageUrl: generatedImage } : null);
      setGeneratedImage(null);
      setImageDescription('');
    } catch (err: any) {
      setError(`Failed to save image: ${err.message}`);
    }
  };

  // Submission-based pagination logic
  const totalSubmissions = submissions.length;
  const currentSubmissionData = submissions[currentSubmission - 1];
  
  const goToSubmission = (submissionNum: number) => {
    setCurrentSubmission(Math.max(1, Math.min(submissionNum, totalSubmissions)));
  };

  const goToLatestSubmission = () => {
    setCurrentSubmission(totalSubmissions);
  };

  const handleStartSession = async () => {
    if (!session || isStartingSession) return;

    setIsStartingSession(true);
    try {
      const result = await api.startDmSession(session.sessionId);
      
      // Session start doesn't create a submission since there's no action
      // Just keep the initial narrative in the regular history for display
      const narrativeEvent: NarrativeEvent = {
        type: 'narrative',
        content: result.narrative,
        timestamp: new Date()
      };

      setNarrativeHistory([narrativeEvent]);
      console.log('Session started with narrative:', result.narrative);
      console.log('DM notes (internal only):', result.dmNotes);
      setIsSessionStarted(true);
      setCurrentSubmission(1);
      
      // Update session summary
      setSession(prev => prev ? {
        ...prev,
        summary: result.narrative
      } : null);
    } catch (err: any) {
      setError(`Failed to start session: ${err.message}`);
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleFinalizeStory = async () => {
    if (!session?.sessionId) return;

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5095/api';
      
      const response = await fetch(`${BASE_URL}/sessions/${session.sessionId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate story PDF');
      }

      // Create download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adventure-story-${session.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Failed to finalize story: ${err.message}`);
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
                    disabled={isStartingSession}
                    className="chrome-button px-8 py-3 text-samuel-off-white text-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                  >
                    {isStartingSession ? (
                      <LoadingSpinner message="Starting..." size="sm" />
                    ) : (
                      "Begin Session"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {/* Show initial narrative if no submissions yet */}
                {submissions.length === 0 && narrativeHistory.length > 0 && (
                  <div className="chrome-card p-4 border-l-4 border-samuel-off-white/20">
                    <MarkdownDisplay content={narrativeHistory[0].content} />
                  </div>
                )}
                
                {/* Show current submission (action + response) */}
                {currentSubmissionData && (
                  <>
                    {/* Player Action */}
                    <div className="chrome-card p-4 border-l-4 border-samuel-bright-red">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-samuel-bright-red flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="font-semibold text-samuel-bright-red">{currentSubmissionData.action}</p>
                      </div>
                    </div>
                    
                    {/* Narrative Response */}
                    <div className="chrome-card p-4 border-l-4 border-samuel-off-white/20">
                      <MarkdownDisplay content={currentSubmissionData.narrative} />
                    </div>
                  </>
                )}
                
                {/* AI thinking indicator */}
                {isSubmittingAction && (
                  <div className="chrome-card p-4 border-l-4 border-samuel-off-white/20">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-samuel-off-white/20 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <LoadingSpinner message="The DM is crafting your story..." size="md" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submission Navigation Controls */}
            {isSessionStarted && totalSubmissions > 1 && (
              <div className="shrink-0 flex items-center justify-between py-2 px-4 bg-black/50 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToSubmission(1)}
                    disabled={currentSubmission === 1}
                    className="chrome-button px-2 py-1 text-xs text-samuel-off-white disabled:opacity-30"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => goToSubmission(currentSubmission - 1)}
                    disabled={currentSubmission === 1}
                    className="chrome-button px-2 py-1 text-xs text-samuel-off-white disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <span className="text-xs text-samuel-off-white/70 px-2">
                    Submission {currentSubmission} of {totalSubmissions}
                  </span>
                  <button
                    onClick={() => goToSubmission(currentSubmission + 1)}
                    disabled={currentSubmission === totalSubmissions}
                    className="chrome-button px-2 py-1 text-xs text-samuel-off-white disabled:opacity-30"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => goToSubmission(totalSubmissions)}
                    disabled={currentSubmission === totalSubmissions}
                    className="chrome-button px-2 py-1 text-xs text-samuel-off-white disabled:opacity-30"
                  >
                    »»
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToLatestSubmission}
                    className="chrome-button px-3 py-1 text-xs text-samuel-off-white"
                  >
                    Latest
                  </button>
                  <button
                    onClick={handleFinalizeStory}
                    className="chrome-button px-3 py-1 text-xs text-samuel-off-white bg-gradient-to-r from-samuel-bright-red to-samuel-dark-red hover:from-samuel-dark-red hover:to-samuel-bright-red"
                    title="Generate a PDF story of your adventure"
                  >
                    📖 Finalize Story
                  </button>
                </div>
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
                  onKeyPress={(e) => e.key === 'Enter' && !isSubmittingAction && handleSubmitAction()}
                  className="flex-1 chrome-input p-3 text-samuel-off-white placeholder-samuel-off-white/50 text-base"
                  placeholder="What do you do?"
                  disabled={isSubmittingAction}
                />
                <button 
                  onClick={handleSubmitAction}
                  disabled={isSubmittingAction}
                  className="chrome-button px-6 py-3 text-samuel-off-white shrink-0 text-base disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isSubmittingAction ? (
                    <LoadingSpinner message="Submitting" size="sm" />
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Action
                    </span>
                  )}
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

            {/* Character Image Section - Hidden for now */}
            {false && (
              <div className="mb-4 shrink-0">
                {character?.imageUrl && (
                  <div className="mb-3">
                    <img 
                      src={character.imageUrl} 
                      alt={character.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-samuel-bright-red/30"
                    />
                  </div>
                )}
                
                {/* Image Generation UI */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      placeholder="Describe character appearance..."
                      className="flex-1 chrome-input text-xs px-2 py-1 text-samuel-off-white placeholder-samuel-off-white/50"
                    />
                    <button
                      onClick={handleGenerateImage}
                      disabled={!imageDescription.trim() || isGeneratingImage}
                      className="chrome-button px-3 py-1 text-xs text-samuel-off-white disabled:opacity-50 shrink-0"
                    >
                      {isGeneratingImage ? (
                        <LoadingSpinner message="" size="sm" />
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {generatedImage && (
                    <div className="space-y-2">
                      <img 
                        src={generatedImage} 
                        alt="Generated character"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-samuel-bright-red"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveImage}
                          className="chrome-button px-2 py-1 text-xs text-samuel-off-white flex-1"
                        >
                          Save Image
                        </button>
                        <button
                          onClick={() => setGeneratedImage(null)}
                          className="chrome-button px-2 py-1 text-xs text-samuel-off-white/70 hover:text-red-400"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
                  <MarkdownDisplay 
                    content={characterSheet}
                    className="text-sm leading-relaxed [&_p]:text-samuel-off-white [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h4]:text-sm [&_h5]:text-xs [&_h6]:text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
