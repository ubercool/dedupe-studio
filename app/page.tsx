'use client';

import { useState, useCallback } from 'react';

interface ClusterRecord {
  id: number;
  records: Record<string, string>[];
  explanation?: string;
  matchReason: string;
}

interface DedupeResult {
  cleanRecords: Record<string, string>[];
  removedCount: number;
  duplicates: any[];
  clusters: ClusterRecord[];
  summary: {
    totalRecords: number;
    uniqueRecords: number;
    duplicatesFound: number;
    processingTime: number;
  };
}

export default function DedupeStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<DedupeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'duplicates' | 'clean'>('duplicates');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://m495c59f.us-east.insforge.app';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
      setResults(null);
    } else {
      setError('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  }, []);

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const csvContent = await file.text();
      const response = await fetch(`${API_URL}/functions/v1/deduplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: csvContent,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      const data: DedupeResult = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCleanCSV = () => {
    if (!results?.cleanRecords.length) return;
    const headers = Object.keys(results.cleanRecords[0]);
    const csvRows = [
      headers.join(','),
      ...results.cleanRecords.map(record =>
        headers.map(h => `"${(record[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace('.csv', '')}-deduplicated.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetApp = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setActiveTab('duplicates');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Dedupe Studio</h1>
          <p className="text-white/60 text-lg">AI-powered deduplication • Free forever</p>
          <p className="text-white/40 text-sm mt-1">by Toolhacker</p>
        </header>
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-6 md:p-8">
          {!results ? (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragging ? 'border-purple-400 bg-purple-500/20' : 'border-white/30 hover:border-white/50'} ${file ? 'border-green-400/50 bg-green-500/10' : ''}`}
              >
                <input type="file" accept=".csv" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {file ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-white font-medium text-lg">{file.name}</p>
                    <p className="text-white/50 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <p className="text-white font-medium text-lg">Drop your CSV here</p>
                    <p className="text-white/50 text-sm">or click to browse</p>
                  </div>
                )}
              </div>
              {error && <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"><p className="text-red-300 text-sm">{error}</p></div>}
              {file && (
                <button onClick={processFile} disabled={isProcessing} className={`w-full mt-6 py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${isProcessing ? 'bg-purple-500/50 text-white/70' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'}`}>
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      Processing with AI...
                    </span>
                  ) : 'Find Duplicates'}
                </button>
              )}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                <div className="text-center"><div className="text-2xl mb-1">🧠</div><p className="text-white/70 text-sm">AI-Powered</p></div>
                <div className="text-center"><div className="text-2xl mb-1">👤</div><p className="text-white/70 text-sm">Nickname Smart</p></div>
                <div className="text-center"><div className="text-2xl mb-1">⚡</div><p className="text-white/70 text-sm">Instant Results</p></div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><p className="text-3xl font-bold text-white">{results.summary.totalRecords}</p><p className="text-white/50 text-sm">Total Records</p></div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><p className="text-3xl font-bold text-green-400">{results.summary.uniqueRecords}</p><p className="text-white/50 text-sm">Unique</p></div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><p className="text-3xl font-bold text-orange-400">{results.summary.duplicatesFound}</p><p className="text-white/50 text-sm">Duplicates</p></div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10"><p className="text-3xl font-bold text-purple-400">{results.clusters.length}</p><p className="text-white/50 text-sm">Clusters</p></div>
              </div>
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button onClick={() => setActiveTab('duplicates')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'duplicates' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}>Duplicates ({results.clusters.length})</button>
                <button onClick={() => setActiveTab('clean')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeTab === 'clean' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}>Clean Data ({results.cleanRecords.length})</button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {activeTab === 'duplicates' ? (
                  results.clusters.length > 0 ? results.clusters.map((cluster, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-medium rounded-lg">Cluster {idx + 1} • {cluster.records.length} records</span>
                      <div className="space-y-2 mt-3 mb-3">
                        {cluster.records.map((record, rIdx) => (
                          <div key={rIdx} className="text-sm text-white/80 bg-white/5 rounded-lg p-2">
                            {Object.entries(record).slice(0, 4).map(([key, value]) => (<span key={key} className="mr-3"><span className="text-white/40">{key}:</span> {value}</span>))}
                          </div>
                        ))}
                      </div>
                      {cluster.explanation && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mt-3">
                          <span className="text-purple-400 text-xs font-medium">🧠 AI Analysis</span>
                          <p className="text-white/70 text-sm mt-1">{cluster.explanation}</p>
                        </div>
                      )}
                    </div>
                  )) : <div className="text-center py-12"><div className="text-4xl mb-3">✨</div><p className="text-white/70">No duplicates found!</p></div>
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/10">{results.cleanRecords[0] && Object.keys(results.cleanRecords[0]).map(h => <th key={h} className="text-left text-white/50 py-2 px-3">{h}</th>)}</tr></thead>
                      <tbody>{results.cleanRecords.slice(0, 50).map((record, idx) => <tr key={idx} className="border-b border-white/5">{Object.values(record).map((v, i) => <td key={i} className="text-white/80 py-2 px-3">{v}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button onClick={downloadCleanCSV} className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg">Download Clean CSV</button>
                <button onClick={resetApp} className="py-3 px-6 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 border border-white/10">New File</button>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center mt-8 text-white/40 text-sm">Replaces $200/month enterprise tools • Built with Claude AI</footer>
      </div>
    </main>
  );
}
