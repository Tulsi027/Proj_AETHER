import { useState } from 'react';
import UploadReport from './components/UploadReport';
import DebateView from './components/DebateView';
import FinalReport from './components/FinalReport';

function App() {
  const [analysisId, setAnalysisId] = useState(null);
  const [debates, setDebates] = useState([]);
  const [finalReport, setFinalReport] = useState(null);
  const [currentState, setCurrentState] = useState('IDLE');
  const [factors, setFactors] = useState([]);

  const handleAnalysisStart = (id) => {
    setAnalysisId(id);
    setDebates([]);
    setFinalReport(null);
    setFactors([]);
    setCurrentState('STARTING');
  };

  const handleProgress = (progress) => {
    setCurrentState(progress.state);
    
    if (progress.data?.factors) {
      setFactors(progress.data.factors);
    }
    
    if (progress.data?.debate) {
      setDebates(prev => {
        const exists = prev.some(d => d.factor.id === progress.data.debate.factor.id);
        if (exists) return prev;
        return [...prev, progress.data.debate];
      });
    }
    
    if (progress.data?.finalReport) {
      setFinalReport(progress.data.finalReport);
    }
  };

  const handleReset = () => {
    setAnalysisId(null);
    setDebates([]);
    setFinalReport(null);
    setFactors([]);
    setCurrentState('IDLE');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Stunning Header */}
        <div className="text-center mb-16 relative">
          {/* Logo/Title with Glow Effect */}
          <div className="inline-block mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 blur-2xl opacity-50 animate-pulse"></div>
            <h1 className="relative text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 tracking-tight drop-shadow-2xl">
              AETHER
            </h1>
          </div>
          
          {/* Subtitle with Animation */}
          <div className="space-y-2 mb-8">
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              Multi-Agent Deliberative Analysis System
            </p>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto leading-relaxed">
              Evidence-tested consensus through structured debate between specialized AI agents
            </p>
          </div>

          {/* Agent Showcase with Hover Effects */}
          <div className="flex justify-center gap-6 mt-10">
            {[
              { emoji: '🔍', name: 'Decipherer', color: 'from-purple-600 to-purple-400', desc: 'Factor Extraction' },
              { emoji: '👤', name: 'Advocate', color: 'from-green-600 to-emerald-400', desc: 'Pro Arguments' },
              { emoji: '🛡️', name: 'Skeptic', color: 'from-red-600 to-rose-400', desc: 'Critical Analysis' },
              { emoji: '📝', name: 'Scribe', color: 'from-blue-600 to-cyan-400', desc: 'Synthesis' }
            ].map((agent, idx) => (
              <div
                key={idx}
                className="group relative"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${agent.color} rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 cursor-pointer`}>
                  <span className="text-4xl">{agent.emoji}</span>
                </div>
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    <p className="text-white font-bold text-sm">{agent.name}</p>
                    <p className="text-gray-300 text-xs">{agent.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content with Fade In Animation */}
        <div className="animate-fadeIn">
          {!analysisId ? (
            <UploadReport onAnalysisStart={handleAnalysisStart} />
          ) : (
            <div className="space-y-8">
              <DebateView 
                analysisId={analysisId}
                debates={debates}
                factors={factors}
                currentState={currentState}
                onProgress={handleProgress}
              />
              
              {finalReport && currentState === 'COMPLETE' && (
                <div className="animate-fadeIn">
                  <FinalReport 
                    report={finalReport}
                    debates={debates}
                    onReset={handleReset}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Pulse Effect */}
      <footer className="relative text-center py-8 mt-16">
        <div className="inline-block px-6 py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
          <p className="text-purple-300 text-sm font-medium">
            ⚡ Powered by Multi-Agent Deliberation • AETHER v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;