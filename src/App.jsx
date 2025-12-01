import React, { useState } from 'react';
import { Sparkles, ImageIcon, MessageSquare, Loader2, Download, Copy, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setTextInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Simulate AI Chat Response
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setIsLoading(true);

    // Simulate API call with realistic delay
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: generateAIResponse(chatInput)
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  // Generate contextual responses
  const generateAIResponse = (input) => {
    const responses = {
      'hello': 'Hello! I\'m your AI assistant powered by advanced language models. How can I help you today?',
      'what can you do': 'I can help you with: creative writing, code generation, image prompts, brainstorming ideas, and answering questions. Try the Image Generator tab to create AI art!',
      'default': `I understand you're asking about "${input}". As an AI assistant, I can help with various tasks including creative content generation, problem-solving, and technical assistance. This demo showcases integration with LLM technologies for the madebyhumans AI Engineer internship portfolio.`
    };

    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return responses.hello;
    } else if (lowerInput.includes('what') || lowerInput.includes('help')) {
      return responses['what can you do'];
    }
    return responses.default;
  };

  // Simulate Image Generation
  const handleImageGenerate = async () => {
    if (!imagePrompt.trim()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Using Picsum for demo (in real app, use Stable Diffusion API)
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(imagePrompt)}/512/512`;
      setGeneratedImage({
        url: imageUrl,
        prompt: imagePrompt
      });
      setIsLoading(false);
    }, 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">AI Creative Studio</h1>
              <p className="text-sm text-purple-200">LLM & Image Generation Integration</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'chat'
                ? 'text-white border-b-2 border-purple-400'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            AI Chat
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'image'
                ? 'text-white border-b-2 border-purple-400'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Image Generator
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'chat' ? (
          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 min-h-[500px] max-h-[500px] overflow-y-auto">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-purple-200">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Start a conversation with AI</p>
                    <p className="text-sm mt-2">Powered by Large Language Models</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-purple-200 focus:outline-none focus:border-purple-400 transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleChatSubmit}
                disabled={isLoading || !chatInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:opacity-50 rounded-xl px-8 py-4 font-medium transition-all"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Generation Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-purple-200">
                  Image Prompt
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate... (e.g., 'a futuristic city at sunset with flying cars')"
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-purple-200 focus:outline-none focus:border-purple-400 transition-all min-h-[120px]"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleImageGenerate}
                disabled={isLoading || !imagePrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-900 disabled:to-blue-900 disabled:opacity-50 rounded-xl px-8 py-4 font-medium transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>
            </div>

            {/* Generated Image Display */}
            {generatedImage && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-white/10">
                  <img
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-purple-200 mb-1">Prompt:</p>
                    <p className="text-white">{generatedImage.prompt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(generatedImage.prompt)}
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all"
                      title="Copy prompt"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <a
                      href={generatedImage.url}
                      download="ai-generated-image.jpg"
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all"
                      title="Download image"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-blue-200">
                <strong>Note:</strong> This demo uses simulated image generation. In production, integrate with Stable Diffusion API (Hugging Face) or DALL-E API for real AI-generated images.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-purple-200 text-sm">
          <p>Built with React + Vite | Portfolio Project for madebyhumans AI Engineer Internship</p>
          <p className="mt-2">Demonstrates: LLM Integration, Image Generation, Full-Stack Development</p>
        </div>
      </footer>
    </div>
  );
}