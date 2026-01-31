"use client";

import { useState, useEffect } from "react";

type ContentType = "email" | "text" | "note";

interface ProcessResponse {
  sessionId: string;
  output: string;
  processingTime: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface WritingInterfaceProps {
  loadSessionId?: string | null;
  onSessionLoaded?: () => void;
}

export default function WritingInterface({ loadSessionId, onSessionLoaded }: WritingInterfaceProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [contentType, setContentType] = useState<ContentType>("text");

  // Get the appropriate mode based on content type (for API compatibility)
  const getModeFromContentType = (ct: ContentType): "professional" | "casual" => {
    return ct === "email" ? "professional" : "casual";
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [previousOutput, setPreviousOutput] = useState("");
  const [showChanges, setShowChanges] = useState(false);

  // Load session when loadSessionId changes
  useEffect(() => {
    const loadSessionData = async () => {
      if (!loadSessionId) return;
      
      try {
        const response = await fetch(`/api/sessions/${loadSessionId}`);
        if (!response.ok) throw new Error('Failed to load session');
        
        const data = await response.json();
        const session = data.session;
        
        setInput(session.originalInput || '');
        setOutput(session.finalOutput || session.initialOutput || '');
        setContentType(session.contentType as ContentType);
        setSessionId(session.id);
        
        // Load refinement history into chat
        if (data.refinements && data.refinements.length > 0) {
          const messages: ChatMessage[] = [];
          data.refinements.forEach((ref: any) => {
            messages.push({
              role: 'user',
              content: ref.refinement_text,
              timestamp: new Date(ref.timestamp)
            });
            messages.push({
              role: 'assistant',
              content: ref.refined_output,
              timestamp: new Date(ref.timestamp)
            });
          });
          setChatHistory(messages);
        }
        
        if (onSessionLoaded) onSessionLoaded();
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session');
      }
    };
    
    loadSessionData();
  }, [loadSessionId, onSessionLoaded]);

  const handleProcess = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/writing/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: input.trim(),
          mode: getModeFromContentType(contentType),
          contentType,
          userId: "temp_user", // TODO: Replace with actual user ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process writing");
      }

      const data: ProcessResponse = await response.json();
      setOutput(data.output);
      setSessionId(data.sessionId);
      setProcessingTime(data.processingTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTryAgain = () => {
    handleProcess();
  };

  const handleStartOver = () => {
    setInput("");
    setOutput("");
    setError(null);
    setSessionId(null);
    setProcessingTime(null);
    setIsCopied(false);
    setShowSuccess(false);
    setChatHistory([]);
    setRefinementInput("");
  };

  const handleQuickAction = async (action: string) => {
    if (!output) return;
    await handleRefinement(action);
  };

  const handleRefinement = async (refinementRequest: string) => {
    if (!output || !refinementRequest.trim()) return;

    setIsRefining(true);
    setError(null);
    
    // Save current output as previous version
    setPreviousOutput(output);

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: refinementRequest,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);
    setRefinementInput("");

    try {
      const response = await fetch("/api/writing/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentOutput: output,
          refinementRequest,
          mode: getModeFromContentType(contentType),
          contentType,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to refine writing");
      }

      const data = await response.json();
      setOutput(data.output);
      setShowChanges(false); // Reset changes view on new refinement

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Updated!',
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Refinement error:", err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleUseThisVersion = async () => {
    if (!sessionId || !output) return;

    try {
      const response = await fetch("/api/writing/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          finalOutput: output,
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        console.log("Session finalized - learning will be triggered");
      }
    } catch (err) {
      console.error("Failed to finalize session:", err);
    }
  };

  // Simple diff highlighting function
  const getHighlightedText = () => {
    if (!showChanges || !previousOutput) return output;
    
    const oldWords = previousOutput.split(/\s+/);
    const newWords = output.split(/\s+/);
    
    let result = '';
    let i = 0, j = 0;
    
    while (i < oldWords.length || j < newWords.length) {
      if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
        result += newWords[j] + ' ';
        i++;
        j++;
      } else if (j < newWords.length && (i >= oldWords.length || oldWords[i] !== newWords[j])) {
        // Added word
        result += `<span class="bg-green-200 dark:bg-green-800/40 px-1 rounded">${newWords[j]}</span> `;
        j++;
      } else if (i < oldWords.length) {
        // Removed word
        result += `<span class="bg-red-200 dark:bg-red-800/40 px-1 rounded line-through">${oldWords[i]}</span> `;
        i++;
      }
    }
    
    return result.trim();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 dark:text-green-400 text-xl mr-3">✓</span>
            <p className="text-green-800 dark:text-green-300 font-medium">
              Success! Your preferences have been saved and mytone is learning your style.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-red-600 dark:text-red-400 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                Processing Error
              </h3>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Type Toggle */}
      <div className="flex justify-center items-center mb-8">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block text-center">
            What are you writing?
          </label>
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 p-1 bg-white dark:bg-slate-800">
            <button
              onClick={() => setContentType("email")}
              className={`px-5 py-2 rounded-md font-medium transition-colors ${
                contentType === "email"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              }`}
              title="Professional emails with proper greeting and signature"
            >
              ✉️ Email
            </button>
            <button
              onClick={() => setContentType("text")}
              className={`px-5 py-2 rounded-md font-medium transition-colors ${
                contentType === "text"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              }`}
              title="Clean, direct text messages - no fluff"
            >
              💬 Text
            </button>
            <button
              onClick={() => setContentType("note")}
              className={`px-5 py-2 rounded-md font-medium transition-colors ${
                contentType === "note"
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
              }`}
              title="Clean documentation and notes"
            >
              📝 Note
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            {contentType === "email" && "Professional tone with greeting & signature"}
            {contentType === "text" && "Clean & direct - gets to the point"}
            {contentType === "note" && "Clear documentation style"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Your Thoughts
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your thoughts, notes, or draft here..."
            className="flex-1 min-h-[400px] p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {input.length} characters · {input.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={handleProcess}
              disabled={!input.trim() || isProcessing}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Processing..." : "Process Writing"}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Polished Version
          </label>
          
          {/* Quick Actions Toolbar - Only show when there's output */}
          {output && (
            <div className="mb-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Quick Actions:</span>
                  <button
                    onClick={() => handleQuickAction("Make this shorter and more concise")}
                    disabled={isRefining}
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    ✂️ Shorter
                  </button>
                  <button
                    onClick={() => handleQuickAction("Make this more formal and professional")}
                    disabled={isRefining}
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    👔 More Formal
                  </button>
                  <button
                    onClick={() => handleQuickAction("Make this more casual and friendly")}
                    disabled={isRefining}
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    😊 More Casual
                  </button>
                  <button
                    onClick={() => handleQuickAction("Add a friendly greeting if not present")}
                    disabled={isRefining}
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    👋 Add Greeting
                  </button>
                </div>
                {previousOutput && (
                  <button
                    onClick={() => setShowChanges(!showChanges)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      showChanges 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {showChanges ? '👁️ Hide Changes' : '🔍 Show Changes'}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {showChanges && previousOutput ? (
            <div
              className="flex-1 min-h-[400px] p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
            />
          ) : (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              placeholder="Your polished version will appear here..."
              className="flex-1 min-h-[400px] p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {output.length} characters · {output.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              {processingTime && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  · Processed in {(processingTime / 1000).toFixed(2)}s
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {output && (
                <>
                  <button
                    onClick={handleCopyToClipboard}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 font-medium transition-colors flex items-center gap-2"
                  >
                    {isCopied ? (
                      <>
                        <span>✓</span>
                        Copied!
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        Copy
                      </>
                    )}
                  </button>
                    <button
                    onClick={handleStartOver}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 font-medium transition-colors"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleTryAgain}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleUseThisVersion}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    ✓ Use This Version
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Refinement Section - Only show when there's output */}
      {output && (
        <div className="mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Refine Your Writing
            </h3>
            
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
                {chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Refinement Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isRefining) {
                    handleRefinement(refinementInput);
                  }
                }}
                placeholder="Tell me what to change... (e.g., 'add a line about deadlines' or 'remove the second paragraph')"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRefining}
              />
              <button
                onClick={() => handleRefinement(refinementInput)}
                disabled={!refinementInput.trim() || isRefining}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
              >
                {isRefining ? "Refining..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {!output && input && !error && (
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-blue-800 dark:text-blue-200">
            Click <strong>Process Writing</strong> to enhance your text while preserving your authentic voice
          </p>
        </div>
      )}
    </div>
  );
}
