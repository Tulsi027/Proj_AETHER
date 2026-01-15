import { useEffect, useState } from 'react';

export default function DebateView({ analysisId, debates, factors, currentState, onProgress }) {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const eventSource = new EventSource(`${API_URL}/api/analysis/${analysisId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);
        
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }

        if (data.state === 'ERROR') {
          setError(data.message);
        }
      } catch (err) {
        console.error('Error parsing event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      setError('Connection lost. Please refresh the page.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [analysisId, onProgress]);

  const getStateIcon = () => {
    switch (currentState) {
      case 'EXTRACTING_FACTORS': 
        return <span className="text-2xl animate-pulse">🔍</span>;
      case 'ADVOCATE_ARGUING': 
        return <span className="text-2xl animate-pulse">👤</span>;
      case 'SKEPTIC_COUNTERING': 
        return <span className="text-2xl animate-pulse">🛡️</span>;
      case 'SYNTHESIZING': 
        return <span className="text-2xl animate-pulse">📝</span>;
      case 'GENERATING_FINAL_REPORT':
        return <span className="text-2xl animate-pulse">📊</span>;
      case 'COMPLETE': 
        return <span className="text-2xl">✅</span>;
      case 'ERROR':
        return <span className="text-2xl">❌</span>;
      default: 
        return <span className="text-2xl animate-spin inline-block">⚙️</span>;
    }
  };

  const getStateColor = () => {
    switch (currentState) {
      case 'EXTRACTING_FACTORS': return 'from-purple-600 to-purple-400';
      case 'ADVOCATE_ARGUING': return 'from-green-600 to-green-400';
      case 'SKEPTIC_COUNTERING': return 'from-red-600 to-red-400';
      case 'SYNTHESIZING': return 'from-blue-600 to-blue-400';
      case 'GENERATING_FINAL_REPORT': return 'from-yellow-600 to-yellow-400';
      case 'COMPLETE': return 'from-green-600 to-green-400';
      case 'ERROR': return 'from-red-600 to-red-400';
      default: return 'from-purple-600 to-pink-600';
    }
  };

  const getStateDescription = () => {
    switch (currentState) {
      case 'EXTRACTING_FACTORS': return 'Analyzing report and identifying key factors...';
      case 'ADVOCATE_ARGUING': return 'Building supportive arguments with evidence...';
      case 'SKEPTIC_COUNTERING': return 'Challenging arguments with counter-evidence...';
      case 'SYNTHESIZING': return 'Evaluating debate and creating balanced synthesis...';
      case 'GENERATING_FINAL_REPORT': return 'Compiling comprehensive final report...';
      case 'COMPLETE': return 'Analysis complete!';
      case 'ERROR': return 'An error occurred during analysis.';
      default: return 'Processing...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`bg-gradient-to-r ${getStateColor()} bg-opacity-20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 shadow-xl`}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {getStateIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">
              {currentState.replace(/_/g, ' ')}
            </h3>
            <p className="text-purple-200 text-sm">
              {getStateDescription()}
            </p>
            {messages.length > 0 && (
              <p className="text-purple-300 text-sm mt-2 italic">
                {messages[messages.length - 1]}
              </p>
            )}
          </div>
          
          {/* Progress Indicator */}
          {factors.length > 0 && debates.length > 0 && currentState !== 'COMPLETE' && (
            <div className="text-right">
              <p className="text-white font-bold text-2xl">
                {debates.length}/{factors.length}
              </p>
              <p className="text-purple-300 text-xs">
                Factors Analyzed
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {factors.length > 0 && currentState !== 'COMPLETE' && (
          <div className="mt-4">
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(debates.length / factors.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Factors Overview */}
      {factors.length > 0 && debates.length === 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-bold text-white">Identified Factors</h3>
          </div>
          <div className="grid gap-3">
            {factors.map((factor, idx) => (
              <div key={idx} className="p-3 bg-white/5 border border-purple-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-white font-semibold">{factor.name}</p>
                    <p className="text-purple-300 text-sm">{factor.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debate Cards */}
      {debates.map((debate, idx) => (
        <div 
          key={idx} 
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 shadow-xl"
        >
          {/* Factor Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-full">
                Factor {idx + 1}
              </span>
              <h3 className="text-2xl font-bold text-white">
                {debate.factor.name}
              </h3>
            </div>
            <p className="text-purple-200 text-sm ml-20">
              {debate.factor.description}
            </p>
          </div>

          {/* Advocate */}
          <div className="mb-4 p-5 bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/40 rounded-xl">
            <div className="flex items-start gap-4">
              <span className="text-3xl">👤</span>
              <div className="flex-1">
                <p className="font-bold text-green-400 text-lg mb-2">THE ADVOCATE</p>
                <p className="text-white mb-3">"{debate.advocate.claim}"</p>
                <div className="bg-green-950/40 rounded-lg p-3">
                  <p className="font-semibold text-green-400 text-sm mb-2">📊 Evidence:</p>
                  <ul className="space-y-1.5">
                    {Array.isArray(debate.advocate.evidence) ? (
                      debate.advocate.evidence.map((e, i) => (
                        <li key={i} className="text-green-100 text-sm">
                          • {typeof e === 'string' ? e : e.statement || JSON.stringify(e)}
                        </li>
                      ))
                    ) : (
                      <li className="text-green-100 text-sm">• {debate.advocate.evidence}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Skeptic */}
          <div className="mb-4 p-5 bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/40 rounded-xl">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🛡️</span>
              <div className="flex-1">
                <p className="font-bold text-red-400 text-lg mb-2">THE SKEPTIC</p>
                <p className="text-red-300 text-sm mb-2">
                  ↳ Responding to: "{debate.skeptic.quoted_claim}"
                </p>
                <p className="text-white mb-3">{debate.skeptic.counter_argument}</p>
                <div className="bg-red-950/40 rounded-lg p-3">
                  <p className="font-semibold text-red-400 text-sm mb-2">📊 Counter-Evidence:</p>
                  <ul className="space-y-1.5">
                    {Array.isArray(debate.skeptic.evidence) ? (
                      debate.skeptic.evidence.map((e, i) => (
                        <li key={i} className="text-red-100 text-sm">
                          • {typeof e === 'string' ? e : e.statement || JSON.stringify(e)}
                        </li>
                      ))
                    ) : (
                      <li className="text-red-100 text-sm">• {debate.skeptic.evidence}</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Synthesis */}
          <div className="p-5 bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/40 rounded-xl">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📝</span>
              <div className="flex-1">
                <p className="font-bold text-blue-400 text-lg mb-3">THE SCRIBE'S VERDICT</p>
                <p className="text-white font-semibold mb-4">⚖️ {debate.synthesis.verdict}</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-green-400 font-bold text-sm mb-2">✅ What Worked:</p>
                    <ul className="ml-6 space-y-1">
                      {debate.synthesis.what_worked.map((w, i) => (
                        <li key={i} className="text-white text-sm">• {w}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-red-400 font-bold text-sm mb-2">❌ What Failed:</p>
                    <ul className="ml-6 space-y-1">
                      {debate.synthesis.what_failed.map((f, i) => (
                        <li key={i} className="text-white text-sm">• {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-950/40 rounded-lg">
                    <p className="text-yellow-400 font-bold text-sm mb-2">⚡ Why:</p>
                    <p className="text-white text-sm">{debate.synthesis.why_it_happened}</p>
                  </div>

                  <div>
                    <p className="text-purple-400 font-bold text-sm mb-2">💡 How to Improve:</p>
                    <ol className="ml-6 space-y-2">
                      {debate.synthesis.how_to_improve.map((item, i) => (
                        <li key={i} className="text-white text-sm">{i + 1}. {item}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}