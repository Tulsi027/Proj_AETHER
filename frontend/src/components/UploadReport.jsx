import { useState } from 'react';

// Sample report data
const SAMPLE_REPORTS = {
  sales: `Q3 2025 Sales Performance Report

EXECUTIVE SUMMARY
Q3 2025 Revenue: $4.8M (down 15% from Q2)
Total Units Sold: 12,450 (down 8%)
Average Deal Size: $385 (down 7%)
Customer Acquisition Cost: $892 (up 22%)

REVENUE BREAKDOWN
- Enterprise Segment: $2.9M (60% of total)
- Mid-Market: $1.4M (29% of total)
- SMB: $0.5M (11% of total)

KEY CHALLENGES
- 23% increase in customer churn rate (now at 8.5%)
- Lead conversion dropped from 18% to 12%
- Average sales cycle extended from 45 to 62 days
- Marketing qualified leads down 31%

REGIONAL PERFORMANCE
- North America: $2.1M (-18% YoY)
- EMEA: $1.8M (-12% YoY)
- APAC: $0.9M (+5% YoY)

RECOMMENDATIONS
1. Implement customer success program to reduce churn
2. Reallocate marketing budget toward high-performing APAC region
3. Review pricing strategy for enterprise segment
4. Accelerate product development for Q4 launch`,

  retention: `Customer Retention Analysis 2025

OVERVIEW
Current Customer Base: 3,847 active customers
Retention Rate: 91.5% (down from 94.2% in 2024)
Average Customer Lifetime Value: $12,450
Monthly Churn Rate: 2.1% (industry average: 1.8%)

CHURN ANALYSIS
Top Reasons for Customer Loss:
1. Pricing concerns (38% of churned customers)
2. Product complexity/usability (27%)
3. Inadequate customer support (18%)
4. Competitive offerings (12%)
5. Other factors (5%)

SEGMENT PERFORMANCE
- Enterprise: 96% retention, $28K avg LTV
- Mid-Market: 92% retention, $15K avg LTV
- SMB: 87% retention, $6K avg LTV

ENGAGEMENT METRICS
- High-engagement customers: 98% retention
- Medium-engagement: 91% retention
- Low-engagement: 76% retention

TIME TO CHURN
- 0-3 months: 32% of all churn
- 4-6 months: 28% of all churn
- 7-12 months: 22% of all churn
- 12+ months: 18% of all churn

RECOMMENDATIONS
1. Launch price optimization program for price-sensitive segments
2. Improve onboarding process to reduce early churn
3. Expand customer success team by 40%
4. Develop competitive intelligence program
5. Create engagement playbooks for at-risk customers`,

  launch: `Product Launch Analysis - "Nexus Pro" Platform

LAUNCH OVERVIEW
Launch Date: September 15, 2025
Pre-launch Signups: 4,200 users
Week 1 Activations: 2,890 users (69% conversion)
Current Active Users: 3,450 (Day 45)

ADOPTION METRICS
- Daily Active Users (DAU): 1,240
- Weekly Active Users (WAU): 2,850
- Monthly Active Users (MAU): 3,450
- DAU/MAU Ratio: 36% (target was 40%)

FEATURE USAGE
Most Used Features:
1. Dashboard Analytics (87% of users)
2. Report Generation (73%)
3. Team Collaboration (61%)
4. API Integration (42%)
5. Custom Workflows (28%)

CUSTOMER FEEDBACK
- Overall Satisfaction: 4.2/5.0
- Net Promoter Score (NPS): +38
- Feature Requests: 847 submitted
- Bug Reports: 124 (78% resolved)

REVENUE IMPACT
- New Revenue: $385K (Month 1)
- Average Revenue Per User: $112/month
- Upgrade Rate (Free to Paid): 23%
- Projected ARR: $4.6M

COMPETITIVE ANALYSIS
- Market Share Gained: 2.3%
- Users from Competitors: 38%
- Unique Value Proposition Rating: 4.5/5

CHALLENGES IDENTIFIED
1. Mobile app adoption below target (15% vs 30% expected)
2. Enterprise segment slower to adopt (22% vs 35% projected)
3. Integration setup time averaging 8 days (target was 3)
4. Customer support tickets 40% higher than forecast

SUCCESS INDICATORS
✓ Exceeded Week 1 activation target by 15%
✓ NPS above industry benchmark (+38 vs +30)
✓ Revenue target achieved at 112% of goal
✓ 89% of users completed onboarding

NEXT STEPS
1. Launch mobile app improvement sprint
2. Develop enterprise onboarding program
3. Create integration marketplace for faster setup
4. Scale support team to handle ticket volume`
};

export default function UploadReport({ onAnalysisStart }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('report', file);

      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onAnalysisStart(data.analysisId);

    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  const handleSampleReport = async (reportType) => {
    setUploading(true);
    setError(null);

    try {
      const reportText = SAMPLE_REPORTS[reportType];
      
      // Create a text file blob from the sample report
      const blob = new Blob([reportText], { type: 'text/plain' });
      const sampleFile = new File([blob], `${reportType}_report.txt`, { type: 'text/plain' });
      
      // Create form data and upload
      const formData = new FormData();
      formData.append('report', sampleFile);

      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onAnalysisStart(data.analysisId);

    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-[0_20px_80px_rgba(147,51,234,0.3)] border border-white/20 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
        
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 relative">
              <div className="absolute inset-0 bg-purple-600 blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative text-7xl animate-bounce">📄</div>
            </div>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
              Upload Your Report
            </h2>
            <p className="text-purple-200 text-lg">
              PDF, Word, Text, or Images (Charts/Diagrams) • Max 10MB
            </p>
            <p className="text-purple-300 text-sm mt-2">
              📊 NEW: Upload charts, graphs, or diagrams for multimodal analysis!
            </p>
          </div>

          <div className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative"
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`
                  flex flex-col items-center justify-center w-full p-12 
                  border-3 border-dashed rounded-2xl cursor-pointer 
                  transition-all duration-300 relative overflow-hidden
                  ${isDragging 
                    ? 'border-pink-400 bg-pink-500/20 scale-105' 
                    : 'border-purple-400/50 bg-white/5 hover:border-purple-300 hover:bg-white/10'
                  }
                `}
              >
                {/* Animated Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                <div className="relative text-center">
                  {file && file.type.startsWith('image/') ? (
                    <div className="mb-4">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg border-2 border-purple-400 shadow-lg"
                      />
                      <p className="text-white font-bold text-xl mt-4">
                        {file.name}
                      </p>
                      <p className="text-purple-300 text-sm">
                        {`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-8xl mb-4 animate-pulse">
                        {file ? '✅' : '📤'}
                      </div>
                      <p className="text-white font-bold text-xl mb-2">
                        {file ? file.name : 'Click or drag file here'}
                      </p>
                      <p className="text-purple-300 text-sm">
                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop your report or image here'}
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border-2 border-red-500 rounded-xl backdrop-blur-sm animate-shake">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="text-red-200 font-bold">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`
                w-full py-5 px-8 rounded-xl font-black text-xl
                transition-all duration-300 shadow-2xl relative overflow-hidden
                ${!file || uploading
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95'
                }
              `}
            >
              {/* Animated Shine Effect */}
              {!uploading && file && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shine"></div>
              )}
              
              <span className="relative flex items-center justify-center gap-3">
                {uploading ? (
                  <>
                    <span className="inline-block w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🚀</span>
                    Begin Deliberation
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Sample Reports */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <p className="text-purple-200 font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Try these sample reports:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: '📊', text: 'Q3 Sales Performance', key: 'sales' },
                { icon: '👥', text: 'Customer Retention', key: 'retention' },
                { icon: '🚀', text: 'Product Launch Analysis', key: 'launch' }
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSampleReport(sample.key)}
                  disabled={uploading}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg transition-all duration-200
                    border border-white/10 text-left
                    ${uploading 
                      ? 'bg-white/5 cursor-not-allowed opacity-50' 
                      : 'bg-white/5 hover:bg-white/20 hover:scale-105 hover:shadow-lg hover:border-purple-400 active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  <span className="text-2xl">{sample.icon}</span>
                  <span className="text-purple-200 text-sm font-medium">{sample.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}