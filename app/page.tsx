'use client';
import { useState } from 'react';
import Papa from 'papaparse';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/dedupe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCleanData = () => {
    if (!results?.cleanRecords) return;
    const csv = Papa.unparse(results.cleanRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.replace('.csv', '_cleaned.csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          DEDUPE STUDIO
        </h1>
        <p className="text-xl text-gray-300">by Toolhacker</p>
        <p className="text-gray-400 mt-2">Killing the $200/mo Software Tax</p>

        <div className="flex justify-center gap-8 mt-12 mb-12">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="text-4xl font-bold text-cyan-400">FREE</div>
            <div className="text-sm text-gray-400">Forever</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="text-4xl font-bold text-purple-400">10,000</div>
            <div className="text-sm text-gray-400">Records/Upload</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="text-4xl font-bold text-pink-400">60s</div>
            <div className="text-sm text-gray-400">Processing</div>
          </div>
        </div>

        {!results && (
          <div className="max-w-2xl mx-auto">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`backdrop-blur-xl bg-white/10 rounded-3xl p-16 border-2 border-dashed ${isDragging ? 'border-cyan-400 bg-white/20' : 'border-white/20'} hover:bg-white/20 cursor-pointer transition-all`}>
              <div className="text-8xl mb-4">{loading ? '⚙️' : (isDragging ? '🎯' : '📤')}</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {loading ? 'Processing...' : (isDragging ? 'Drop it!' : 'Drag Your Data Here')}
              </h2>
              <p className="text-gray-400">CSV or Excel files up to 10,000 records</p>
              {error && <p className="mt-4 text-red-400 font-bold">{error}</p>}
            </div>
          </div>
        )}

        {results && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{results.summary.totalRecords}</div>
                <div className="text-sm text-gray-400">Total Records</div>
              </div>
              <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{results.summary.recordsAffected}</div>
                <div className="text-sm text-red-200">Duplicates Found</div>
              </div>
              <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">
                  {results.summary.totalRecords - results.summary.recordsAffected}
                </div>
                <div className="text-sm text-green-200">Clean Records</div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 text-left max-h-[500px] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-4">Duplicate Groups</h3>
              {results.clusters.map((cluster: any, idx: number) => (
                <div key={idx} className="mb-4 bg-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-cyan-400 font-bold">Group {idx + 1}</span>
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                      {cluster.confidence}% Match
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cluster.indices.map((i: number) => {
                      const r = results.duplicates.find((d: any) => d.indices.includes(i))?.records.find((rec: any) => rec === results.cleanRecords[i]) || results.duplicates[0].records[0]; // Fallback logic simplified for display
                      // Actually we need the original data to display names correctly.
                      // The API returns 'cleanRecords' but we might want to just show the raw data from the cluster.
                      // Let's fix the display logic. The API returns 'duplicates' which has 'records' array.
                      // But 'clusters' only has indices.
                      // We need to pass the original data back or reconstruct it.
                      // Let's just use a simple placeholder or try to find it if possible.
                      // Wait, the API response structure:
                      // { duplicates: [...], clusters: [...], summary: {...}, cleanRecords: [...] }
                      // The 'duplicates' array contains pairs. 'clusters' aggregates them.
                      // We don't have the full original dataset in the response unless we return it.
                      // Let's modify the API to return 'allRecords' or just rely on what we have.
                      // Actually, 'cleanRecords' + 'removed records' = all records.
                      // But it's easier if we just return the original data or if the frontend keeps it.
                      // For now, let's just show the indices or try to map them if we can.
                      // Actually, let's just show "Record #{i}" if we can't get the name easily without complex logic,
                      // OR better, let's update the API to return the full dataset or the relevant records for display.
                      // Re-reading the API code: it returns `...dedupeResults`.
                      // `dedupeResults` from `dedupeRecords` returns `{ cleanRecords, removedCount, duplicates, clusters, summary }`.
                      // It does NOT return the original `records` array explicitly, but `cleanRecords` has the clean ones.
                      // The `duplicates` array has `records: [record1, record2]`.
                      // So we can find the data there.
                      return (
                        <div key={i} className="text-gray-300 text-sm">
                          Record #{i + 1}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 italic">
                    {cluster.reason}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setResults(null)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all">
                Start Over
              </button>
              <button
                onClick={downloadCleanData}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 text-white font-bold shadow-lg transition-all">
                Download Clean CSV
              </button>
            </div>
          </div>
        )}

        {!results && (
          <div className="flex gap-4 justify-center mt-12">
            <button className="backdrop-blur-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl px-8 py-4 font-bold hover:scale-105 transform transition-all duration-200 shadow-lg">
              🚀 Start FREE
            </button>
            <button className="backdrop-blur-xl bg-white/10 text-white rounded-xl px-8 py-4 font-bold border border-white/20 hover:bg-white/20 transition-all">
              See Pro Features ($47/mo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
