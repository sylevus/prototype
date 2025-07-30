"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';

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
    <div className="flex flex-col w-full flex-grow p-4 h-full">
      <header 
        className="p-4 text-center shadow-md shrink-0"
        style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
      >
        <h1 className="text-2xl font-bold">Negotiate Your Character with AI</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 w-full">
          {messages.map((message, index) => {
            const formattedText = message.sender === 'ai' 
              ? message.text
                .replace(/^#### (.*$)/gm, '• $1')
                .replace(/\n\n/g, '\n')
              : message.text;

            return (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-900 text-white ml-auto'
                    : 'bg-gray-800 text-white whitespace-pre-wrap'
                }`}
              >
                {formattedText.split('\n').map((line, i) => (
                  <div key={i} className="mb-1">
                    {line || <br />}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </main>

      <footer 
        className="p-4 shrink-0"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-2 rounded-lg bg-gray-700 text-white"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg disabled:bg-gray-500"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
          <button 
            onClick={handleSaveCharacter} 
            disabled={isLoading || messages.length === 0}
            className="bg-green-600 text-white p-2 rounded-lg disabled:bg-gray-500"
          >
            Save Character
          </button>
        </div>
      </footer>
    </div>
  );
}
