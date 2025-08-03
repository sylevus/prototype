"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';
import MarkdownDisplay from '../components/MarkdownDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiProviderSelector from '../components/ApiProviderSelector';

// A simple type for our chat messages
type Message = {
  text: string;
  sender: 'user' | 'ai';
};

export default function CharacterCreationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const newUserMessage: Message = { sender: 'user', text: input };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const data = await api.post('ai/negotiate', { 
        messages: updatedMessages.map(m => ({ sender: m.sender, text: m.text }))
      });
      
      const aiMessage: Message = { sender: 'ai', text: data.response };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = { sender: 'ai', text: `Error: ${error.message}` };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCharacter = async () => {
    const lastAssistantMessage = messages.filter(m => m.sender === 'ai').pop();
    const finalCharacterSheet = lastAssistantMessage ? lastAssistantMessage.text : '';

    const characterName = window.prompt('Enter a name for your character:');
    if (characterName && characterName.trim() !== '') {
      setIsLoading(true);
      try {
        const saveResponse = await api.post('character/saveFromConversation', {
          name: characterName,
          characterSheet: finalCharacterSheet,
          conversation: messages,
          isMarkdown: true,
        });

        alert(`Character '${characterName}' saved successfully!`);

        // Get or create session
        await api.post(`session/character/${saveResponse.characterId}`, {});
        
        // Redirect to the session page
        router.push(`/session/${saveResponse.characterId}`);
      } catch (error: any) {
        console.error('Save character error:', error);
        alert(`Error saving character: ${error.message || 'Unknown error occurred'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0">
        <img 
          src="/images/FantasyBackground2.jpg" 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex flex-col w-full flex-grow h-full max-w-4xl mx-auto">
        <header className="shrink-0 mx-4 mt-16 flex items-center justify-between">
          <div className="chrome-surface p-3 rounded-xl backdrop-blur-md flex items-center gap-3">
            <h1 className="text-lg font-bold bg-gradient-to-r from-samuel-off-white to-samuel-bright-red bg-clip-text text-transparent">
              Character Creation
            </h1>
            <button 
              onClick={() => setShowTips(!showTips)}
              className="p-1 rounded-lg hover:bg-samuel-dark-red/20 transition-all duration-300"
              title="Toggle tips"
            >
              <svg className="w-4 h-4 text-samuel-off-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          <ApiProviderSelector />
        </header>

        {/* Tips Overlay */}
        {showTips && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTips(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative chrome-card-fantasy p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-samuel-off-white">Character Creation Tips</h2>
                <button 
                  onClick={() => setShowTips(false)}
                  className="p-1 hover:bg-samuel-dark-red/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-samuel-off-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid gap-4">
                <div className="p-4 bg-samuel-dark-red/20 border border-samuel-bright-red/30 rounded-lg">
                  <h3 className="text-samuel-bright-red font-semibold mb-2">💬 Collaborate</h3>
                  <p className="text-sm text-samuel-off-white/70">Work with the AI to refine your character concept and explore different possibilities.</p>
                </div>
                <div className="p-4 bg-samuel-dark-red/20 border border-samuel-bright-red/30 rounded-lg">
                  <h3 className="text-samuel-bright-red font-semibold mb-2">📋 Define Rules</h3>
                  <p className="text-sm text-samuel-off-white/70">Specify your game system (D&D 5e, Pathfinder, etc.) for accurate character sheets.</p>
                </div>
                <div className="p-4 bg-samuel-dark-red/20 border border-samuel-bright-red/30 rounded-lg">
                  <h3 className="text-samuel-bright-red font-semibold mb-2">🎯 Be Specific</h3>
                  <p className="text-sm text-samuel-off-white/70">Describe personality traits, goals, and backstory elements for richer characters.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 chrome-surface mx-4 mt-4 rounded-xl">
          <div className="space-y-6 w-full mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-samuel-bright-red to-samuel-dark-red flex items-center justify-center mystic-glow">
                  <svg className="w-8 h-8 text-samuel-off-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-6 transition-all duration-300 ${
                message.sender === 'user'
                  ? 'chrome-chat-user text-samuel-off-white'
                  : 'chrome-chat-ai text-samuel-off-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  message.sender === 'user'
                    ? 'bg-samuel-off-white/20'
                    : 'bg-samuel-bright-red/20'
                }`}>
                  {message.sender === 'user' ? (
                    <svg className="w-4 h-4 text-samuel-off-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-samuel-bright-red" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  {message.sender === 'ai' ? (
                    <MarkdownDisplay content={message.text} />
                  ) : (
                    <div className="text-samuel-off-white whitespace-pre-wrap">
                      {message.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* AI thinking indicator */}
          {isLoading && (
            <div className="p-6 chrome-chat-ai text-samuel-off-white">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-samuel-bright-red/20">
                  <svg className="w-4 h-4 text-samuel-bright-red" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <LoadingSpinner message="AI is thinking..." size="md" />
                </div>
              </div>
            </div>
          )}
          </div>
        </main>

        <footer className="chrome-surface p-6 shrink-0 mx-4 mb-4 rounded-xl border-t border-white/5">
          <div className="flex gap-3 w-full mx-auto">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 chrome-input p-4 text-samuel-off-white placeholder-samuel-off-white/50"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading}
            className="chrome-button px-6 py-4 text-samuel-off-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {isLoading ? (
              <LoadingSpinner message="Sending" size="sm" />
            ) : (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </div>
            )}
          </button>
          <button 
            onClick={handleSaveCharacter} 
            disabled={isLoading || messages.length === 0}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-samuel-off-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:shadow-lg hover:-translate-y-0.5 min-w-[180px]"
            title="Generates final character sheet and game rules, then saves your character"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Finalize & Save
            </div>
          </button>
          </div>
        </footer>
      </div>
    </>
  );
}
