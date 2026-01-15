import { FileText, Download, RefreshCw, CheckCircle, XCircle, Lightbulb, AlertTriangle } from 'lucide-react';

export default function FinalReport({ report, debates, onReset }) {
  const handleExport = () => {
    const reportText = `
═══════════════════════════════════════════════════════════
PROJECT AETHER - MULTI-AGENT ANALYSIS REPORT
═══════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleString()}
Analysis ID: ${Date.now()}

═══════════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════

${report.executive_summary}

═══════════════════════════════════════════════════════════
KEY FINDINGS
═══════════════════════════════════════════════════════════

${report.key_findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

═══════════════════════════════════════════════════════════
TOP PRIORITIES
═══════════════════════════════════════════════════════════

${report.top_priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

═══════════════════════════════════════════════════════════
OVERALL ASSESSMENT
═══════════════════════════════════════════════════════════

${report.overall_assessment}

═══════════════════════════════════════════════════════════
DETAILED FACTOR ANALYSIS
═══════════════════════════════════════════════════════════

${debates.map((d, i) => `
───────────────────────────────────────────────────────────
FACTOR ${i + 1}: ${d.factor.name}
───────────────────────────────────────────────────────────

Description: ${d.factor.description}
Context: ${d.factor.context}

VERDICT: ${d.synthesis.verdict}

✓ WHAT WORKED:
${d.synthesis.what_worked.map(w => `  • ${w}`).join('\n')}

✗ WHAT FAILED:
${d.synthesis.what_failed.map(f => `  • ${f}`).join('\n')}

⚡ WHY IT HAPPENED:
${d.synthesis.why_it_happened}

💡 HOW TO IMPROVE:
${d.synthesis.how_to_improve.map((r, idx) => `  ${idx + 1}. ${r}`).join('\n')}

CONFIDENCE LEVEL: ${d.synthesis.confidence}

───────────────────────────────────────────────────────────
DEBATE TRANSCRIPT
───────────────────────────────────────────────────────────

🟢 THE ADVOCATE (Pro Position):
Claim: ${d.advocate.claim}

Evidence:
${d.advocate.evidence.map((e, idx) => `  ${idx + 1}. ${e}`).join('\n')}

Reasoning: ${d.advocate.reasoning}

🔴 THE SKEPTIC (Con Position):
Responding to: "${d.skeptic.quoted_claim}"

Counter-Argument: ${d.skeptic.counter_argument}

Counter-Evidence:
${d.skeptic.evidence.map((e, idx) => `  ${idx + 1}. ${e}`).join('\n')}

Reasoning: ${d.skeptic.reasoning}

`).join('\n')}

═══════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════

This report was generated through structured multi-agent deliberation.
Each conclusion represents evidence-tested consensus, not single-model opinion.

System: Project AETHER v1.0
Agents: The Decipherer | The Advocate | The Skeptic | The Scribe
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-full">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Final Report</h2>
              <p className="text-purple-200 text-sm mt-1">
                Synthesized from {debates.length} factor debates
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/50"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-white">Executive Summary</h3>
        </div>
        <p className="text-white leading-relaxed text-lg">
          {report.executive_summary}
        </p>
      </div>

      {/* Key Findings */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-white">Key Findings</h3>
        </div>
        <div className="space-y-3">
          {report.key_findings.map((finding, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {idx + 1}
              </div>
              <p className="text-white pt-1">{finding}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Priorities */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-white">Top Priorities</h3>
        </div>
        <div className="space-y-3">
          {report.top_priorities.map((priority, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-500/30 hover:border-orange-500/50 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {idx + 1}
              </div>
              <p className="text-white pt-1 font-medium">{priority}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Overall Assessment</h3>
        </div>
        <p className="text-white text-lg leading-relaxed">
          {report.overall_assessment}
        </p>
      </div>

      {/* Factor Details */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-white">Detailed Factor Analysis</h3>
        </div>

        <div className="space-y-6">
          {debates.map((debate, idx) => (
            <div
              key={idx}
              className="p-5 bg-white/5 rounded-lg border border-purple-500/20"
            >
              {/* Factor Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                    Factor {idx + 1}
                  </span>
                  <h4 className="text-lg font-bold text-white">
                    {debate.factor.name}
                  </h4>
                </div>
                <p className="text-purple-200 text-sm">{debate.factor.description}</p>
              </div>

              {/* Verdict */}
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 font-semibold">
                  📊 Verdict: <span className="text-white">{debate.synthesis.verdict}</span>
                </p>
              </div>

              {/* What Worked */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 font-bold">What Worked</p>
                </div>
                <ul className="space-y-2 ml-7">
                  {debate.synthesis.what_worked.map((item, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What Failed */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 font-bold">What Failed</p>
                </div>
                <ul className="space-y-2 ml-7">
                  {debate.synthesis.what_failed.map((item, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Why It Happened */}
              <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 font-bold mb-2">⚡ Why It Happened:</p>
                <p className="text-white text-sm">{debate.synthesis.why_it_happened}</p>
              </div>

              {/* How to Improve */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <p className="text-yellow-400 font-bold">How to Improve</p>
                </div>
                <ol className="space-y-2 ml-7">
                  {debate.synthesis.how_to_improve.map((item, i) => (
                    <li key={i} className="text-white text-sm flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Confidence */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-purple-300">
                  <span className="font-semibold">Confidence:</span> {debate.synthesis.confidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-purple-300 text-sm">
          Report generated by Project AETHER Multi-Agent Deliberation System
        </p>
        <p className="text-purple-400 text-xs mt-1">
          Evidence-tested consensus through structured debate
        </p>
      </div>
    </div>
  );
}