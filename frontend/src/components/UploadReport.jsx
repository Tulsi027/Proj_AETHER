import { useState } from 'react';

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
                { icon: '📊', text: 'Q3 Sales Performance' },
                { icon: '👥', text: 'Customer Retention' },
                { icon: '🚀', text: 'Product Launch Analysis' }
              ].map((sample, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                >
                  <span className="text-2xl">{sample.icon}</span>
                  <span className="text-purple-200 text-sm font-medium">{sample.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}