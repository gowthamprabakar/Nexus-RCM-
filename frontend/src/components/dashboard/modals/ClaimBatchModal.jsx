import React, { useState } from 'react';

export function ClaimBatchModal({ onSubmit, onClose }) {
    const [batchName, setBatchName] = useState(`Batch-${new Date().toISOString().slice(0, 10)}-001`);
    const [provider, setProvider] = useState("All Providers");
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (!file) {
            alert("Please upload an 837 file or CSV manifest.");
            return;
        }
        // Simulate processing
        onSubmit({
            name: batchName,
            provider,
            fileName: file.name,
            size: file.size,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-th-surface-raised border border-slate-200 dark:border-th-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-th-border flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Submit New Claim Batch</h3>
                        <p className="text-xs text-th-muted">Upload 837 or CSV files for processing</p>
                    </div>
                    <button onClick={onClose} className="text-th-secondary hover:text-slate-600 dark:hover:text-th-heading transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-th-muted dark:text-th-secondary uppercase mb-1.5">Batch Identifier</label>
                        <input
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-th-border rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-th-heading outline-none"
                            type="text"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-th-muted dark:text-th-secondary uppercase mb-1.5">Provider Entity</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-th-border rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-th-heading outline-none"
                        >
                            <option>All Providers</option>
                            <option>Metropolitan General</option>
                            <option>Northside Surgical Center</option>
                        </select>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 dark:border-th-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-th-surface-overlay/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".csv,.txt,.837"
                        />
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                        </div>
                        {file ? (
                            <div>
                                <p className="text-sm font-bold text-primary">{file.name}</p>
                                <p className="text-xs text-th-muted">{(file.size / 1024).toFixed(1)} KB ready to upload</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-th-heading">Click to upload or drag and drop</p>
                                <p className="text-xs text-th-secondary mt-1">Accepts 837 (EDI), CSV, or Excel formats</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-th-border flex justify-end gap-3 bg-slate-50 dark:bg-th-surface-raised/20">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-th-muted hover:text-slate-700 dark:hover:text-th-heading transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-primary hover:bg-primary/90 text-th-heading text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                        {file ? 'Upload & Process' : 'Select File'}
                    </button>
                </div>
            </div>
        </div>
    );
}
