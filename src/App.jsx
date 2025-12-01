import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Image, MessageSquare, Loader2, Download, Copy, Check, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from "./config";
export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [useRealAPI, setUseRealAPI] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Check if backend proxy is available
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    // Check if backend is running
    fetch(`${API_BASE_URL}/api/health`)
      .then(() => setBackendAvailable(true))
      .catch(() => setBackendAvailable(false));
  }, []);

  // Real AI Chat with Claude API via Proxy
  const handleRealChatSubmit = async () => {
  if (!chatInput.trim()) return;

  const userMessage = { role: "user", content: chatInput };
  setChatMessages(prev => [...prev, userMessage]);
  setChatInput("");
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [...chatMessages, userMessage]
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Server error");

    let aiText = "";

    
    if (data.choices?.[0]?.message?.content) {
      aiText = data.choices[0].message.content;
    }

    
    else if (data.content?.[0]?.text) {
      aiText = data.content[0].text;
    }

    
    else {
      throw new Error("Invalid response format from API");
    }

    setChatMessages(prev => [
      ...prev,
      { role: "assistant", content: aiText }
    ]);
  } catch (err) {
    console.error("Chat error:", err);
    setError(`Chat Error: ${err.message}`);

    setChatMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: "⚠️ Error connecting to AI API. Please check your API key."
      }
    ]);
  } finally {
    setIsLoading(false);
  }
};


  // Simulated AI Chat (Fallback)
  const handleSimulatedChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: generateSimulatedResponse(chatInput)
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const generateSimulatedResponse = (input) => {
    const responses = {
      'hello': 'Hello! I\'m your AI assistant. This is demo mode. To use real Claude AI, please add your Anthropic API key to the .env file.',
      'what': 'I can help with creative writing, coding, analysis, and more. Enable real AI by adding API keys!',
      'default': `You asked: "${input}"\n\nThis is a simulated response. For real AI conversations powered by Claude, please configure your VITE_ANTHROPIC_API_KEY in the .env file. The real integration is ready and will provide intelligent, context-aware responses!`
    };

    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) return responses.hello;
    if (lowerInput.includes('what') || lowerInput.includes('help')) return responses.what;
    return responses.default;
  };

  // Real Image Generation via Proxy
  const handleRealImageGenerate = async () => {
    if (!imagePrompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imagePrompt,
        })
      });

      const contentType = response.headers.get('content-type');

      // Check if response is JSON (error)
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (data.error) {
          if (data.error.type === 'model_loading') {
            setError(`⏳ ${data.error.message}`);
            setIsLoading(false);
            return;
          }
          throw new Error(data.error.message || 'Image generation failed');
        }
      }

      // Check for non-OK status
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Response should be an image
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty image');
      }

      const imageUrl = URL.createObjectURL(blob);
      
      setGeneratedImage({
        url: imageUrl,
        prompt: imagePrompt,
        isReal: true
      });
      
      console.log('✅ Image loaded successfully');
      
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      console.error('Image generation error:', err);
      
      setError(`Image Error: ${errorMessage}. Switching to demo mode.`);
      
      // Fallback to demo mode
      setTimeout(() => {
        handleSimulatedImage();
      }, 500);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Image Generation (Fallback)
  const handleSimulatedImage = async () => {
    if (!imagePrompt.trim()) return;

    setIsLoading(true);
    
    setTimeout(() => {
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(imagePrompt)}/768/768`;
      setGeneratedImage({
        url: imageUrl,
        prompt: imagePrompt,
        isReal: false
      });
      setIsLoading(false);
    }, 1500);
  };

  // Main handlers
  const handleChatSubmit = () => {
    if (backendAvailable && useRealAPI) {
      handleRealChatSubmit();
    } else {
      handleSimulatedChat();
    }
  };

  const handleImageGenerate = () => {
    if (backendAvailable && useRealAPI) {
      handleRealImageGenerate();
    } else {
      handleSimulatedImage();
    }
  };

  // Alternative: Use free Pollinations API
  const handlePollinationsImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/image-free`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: imagePrompt })
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      setGeneratedImage({
        url: imageUrl,
        prompt: imagePrompt,
        isReal: true
      });
    } catch (err) {
      setError(`Error: ${err.message}`);
      handleSimulatedImage();
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">AI Creative Studio</h1>
                <p className="text-sm text-purple-200">LLM & Image Generation Integration</p>
              </div>
            </div>
            
            {/* API Mode Toggle */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-purple-200">Real AI API</span>
              <button
                onClick={() => setUseRealAPI(!useRealAPI)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  useRealAPI && backendAvailable 
                    ? 'bg-green-500' 
                    : 'bg-gray-600'
                }`}
                disabled={!backendAvailable}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    useRealAPI ? 'translate-x-6' : ''
                  }`}
                />
              </button>
              <span className={`text-xs ${useRealAPI && backendAvailable ? 'text-green-400' : 'text-gray-400'}`}>
                {useRealAPI && backendAvailable ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* API Status Banner */}
      {!backendAvailable && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-200">
                  <strong>Backend Not Running:</strong> Start the backend server for real AI features.
                </p>
                <p className="text-xs text-yellow-300 mt-2">
                  Run: <code className="bg-black/20 px-2 py-1 rounded">npm run server</code> in a separate terminal
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            AI Chat {backendAvailable && useRealAPI && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">LIVE</span>}
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
              activeTab === 'image'
                ? 'text-white border-b-2 border-purple-400'
                : 'text-purple-200 hover:text-white'
            }`}
          >
            <Image className="w-5 h-5" />
            Image Generator {backendAvailable && useRealAPI && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">LIVE</span>}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}

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
                    <p className="text-sm mt-2">
                      {backendAvailable && useRealAPI 
                        ? 'Powered by Claude Sonnet 4' 
                        : 'Demo mode - Start backend for real AI'}
                    </p>
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleChatSubmit()}
                placeholder="Ask me anything..."
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-purple-200 focus:outline-none focus:border-purple-400 transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleChatSubmit}
                disabled={isLoading || !chatInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:opacity-50 rounded-xl px-8 py-4 font-medium transition-all"
              >
                {isLoading ? 'Sending...' : 'Send'}
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
                  placeholder="Describe the image you want to generate... e.g., 'a futuristic cyberpunk city at sunset with neon lights and flying cars'"
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
                    Generating Image...
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
                <div className="aspect-square rounded-xl overflow-hidden bg-white/10 relative">
                  <img
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    className="w-full h-full object-cover"
                  />
                  {!generatedImage.isReal && (
                    <div className="absolute top-4 right-4 bg-yellow-500/90 text-yellow-900 text-xs px-3 py-1 rounded-full font-medium">
                      Demo Image
                    </div>
                  )}
                  {generatedImage.isReal && (
                    <div className="absolute top-4 right-4 bg-green-500/90 text-green-900 text-xs px-3 py-1 rounded-full font-medium">
                      AI Generated
                    </div>
                  )}
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
                    <button
                      onClick={downloadImage}
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-all"
                      title="Download image"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className={`border rounded-xl p-4 ${
              backendAvailable && useRealAPI 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-blue-500/10 border-blue-500/20'
            }`}>
              <p className={`text-sm ${
                backendAvailable && useRealAPI ? 'text-green-200' : 'text-blue-200'
              }`}>
                {backendAvailable && useRealAPI ? (
                  <><strong>✓ Real AI Active:</strong> Using Stable Diffusion XL via Hugging Face API</>
                ) : (
                  <><strong>Demo Mode:</strong> Start backend server (npm run server) for real AI image generation</>
                )}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-purple-200 text-sm">
          <p className="font-medium">Built with React + Vite + Tailwind CSS</p>
          <p className="mt-2">Portfolio Project by <a href="https://www.linkedin.com/in/syifaauljinan/" target="_blank" className="underline">Muhammad Syifaaul Jinan</a></p>
          <p className="mt-1 text-xs">
            Copyright &copy; 2025. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}