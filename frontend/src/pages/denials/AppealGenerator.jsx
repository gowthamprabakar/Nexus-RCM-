import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export function AppealGenerator() {
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Simulate AI generation delay
        const timer = setTimeout(() => {
            setIsGenerating(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleRegenerate = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000);
    };

    const handleSubmit = () => {
        setShowSuccess(true);
        setTimeout(() => {
            navigate('/denials');
        }, 3000);
    };
    return (
        <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden font-sans bg-slate-50 dark:bg-background-dark">
            {/* Left Sidebar: Denial Details */}
            <aside className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark overflow-y-auto">
                <div className="p-6">
                    <NavLink to="/denials" className="flex items-center gap-2 mb-6 text-slate-500 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        <span className="text-xs font-medium uppercase tracking-wider">Back to Queue</span>
                    </NavLink>
                    <div className="mb-8">
                        <h1 className="text-slate-900 dark:text-white text-xl font-bold mb-1">Appeal Workspace</h1>
                        <p className="text-slate-500 text-xs font-mono">CASE ID: #88219-BC</p>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Claim Information</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-400">Payer</span>
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">BC</div>
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">BlueCross BlueShield</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-400">Reason</span>
                                    <span className="text-sm font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 w-fit">Medical Necessity</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-400">Denial Code</span>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">CO-50</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-slate-400">Amount</span>
                                    <span className="text-sm font-bold text-primary">$12,450.00</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-200 dark:border-border-dark">
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Navigation</h3>
                            <nav className="space-y-1">
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20" href="#">
                                    <span className="material-symbols-outlined text-[20px] fill-[1]">info</span>
                                    <span className="text-sm font-medium">Denial Context</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                                    <span className="material-symbols-outlined text-[20px]">policy</span>
                                    <span className="text-sm font-medium">Payer Policy</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                    <span className="text-sm font-medium">Clinical Docs</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                                    <span className="material-symbols-outlined text-[20px]">history</span>
                                    <span className="text-sm font-medium">History</span>
                                </a>
                            </nav>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Center Panel: AI Editor */}
            <section className="flex-1 flex flex-col bg-slate-50 dark:bg-background-dark/50 overflow-hidden relative">
                {/* Confidence Meter Bar */}
                <div className="p-6 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark flex items-center justify-between z-10">
                    <div className="flex-1 max-w-md">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
                                <p className="text-slate-900 dark:text-white text-sm font-bold">Probability of Overturn</p>
                            </div>
                            <p className="text-primary text-sm font-bold">88%</p>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,236,0.5)] w-[88%]"></div>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-2 italic">Confidence optimized based on 452 historically similar Medical Necessity appeals for BCBS.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">undo</span>
                        </button>
                        <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">redo</span>
                        </button>
                        <button
                            onClick={handleRegenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-transparent hover:border-primary/50 transition-all disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isGenerating ? 'animate-spin' : ''}`}>
                                {isGenerating ? 'sync' : 'magic_button'}
                            </span>
                            {isGenerating ? 'Generating...' : 'Re-Generate Draft'}
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                    {isGenerating ? (
                        <div className="w-full max-w-[800px] bg-white dark:bg-card-dark shadow-xl rounded-xl p-12 min-h-[1000px] border border-slate-200 dark:border-border-dark flex flex-col items-center justify-center gap-6">
                            <div className="size-16 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-primary animate-spin"></div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-bold text-slate-900 dark:text-white">Drafting Clinical Appeal...</p>
                                <p className="text-sm text-slate-500">Analyzing payer policy 4.02.1 vs patient medical history</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-[800px] bg-white dark:bg-card-dark shadow-xl rounded-xl p-12 min-h-[1000px] border border-slate-200 dark:border-border-dark animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="space-y-8 text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-serif">
                                <div className="flex justify-between items-start mb-12 font-sans">
                                    <div className="space-y-1">
                                        <p className="font-bold">Date: October 24, 2023</p>
                                        <p>To: BlueCross BlueShield Appeals Department</p>
                                        <p>Re: Formal Appeal for Claim #88219-BC</p>
                                        <p>Patient: John Doe | DOB: 05/12/1978</p>
                                    </div>
                                    <div className="text-right text-xs text-slate-400 font-mono">
                                        AI DRAFT V2.4
                                    </div>
                                </div>
                                <p>Dear Medical Director,</p>
                                <p>This letter serves as a formal appeal of the denial for the aforementioned claim based on "Lack of Medical Necessity" (CO-50). We believe the clinical evidence provided demonstrates that the procedure performed was medically necessary according to your policy guidelines and standard of care.</p>
                                <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg font-sans">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <span className="material-symbols-outlined text-[18px]">verified</span>
                                        <span className="text-xs font-bold uppercase tracking-wider">AI Highlight: Clinical Justification</span>
                                    </div>
                                    <p className="italic text-slate-600 dark:text-slate-300">"According to the H&P report from 10/10/23, the patient presented with chronic lumbar radiculopathy unresponsive to 6 months of conservative management. Payer policy 4.02.1 specifies that surgical intervention is indicated when conservative measures fail to provide relief. Our attached documentation clearly confirms the failure of physical therapy and pharmacological intervention."</p>
                                </div>
                                <p>Furthermore, the Operative Report (Section 4.1) confirms findings of severe foraminal stenosis which directly aligns with the ICD-10 codes submitted. We have attached the specific imaging reports that correlate with these intraoperative findings.</p>
                                <p>We request an immediate review of this appeal and the overturning of the denial. Thank you for your time and professional consideration.</p>
                                <div className="pt-12">
                                    <p>Sincerely,</p>
                                    <p className="font-bold mt-4">RevenueAI Automated System</p>
                                    <p className="text-xs text-slate-500 font-sans">On behalf of: Metropolitan General Health</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Global Floating Action Bar */}
                <div className="absolute bottom-6 right-6 flex items-center gap-4 z-50">
                    <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800 text-white font-bold text-sm shadow-2xl hover:bg-slate-700 transition-all border border-slate-600">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-bold text-base shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                        Submit Final Appeal
                    </button>
                </div>

                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-[100] bg-white/90 dark:bg-card-dark/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-card-dark p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-border-dark flex flex-col items-center text-center max-w-md animate-in zoom-in-50 duration-500 slide-in-from-bottom-10">
                            <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl">check_circle</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Appeal Submitted!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Your appeal for Claim #88219-BC has been successfully transmitted via EDI 277 to BlueCross BlueShield.</p>
                            <div className="flex flex-col w-full gap-2">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Trace ID</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">1Z9928383-001</span>
                                </div>
                                <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm mt-2">
                                    Return to Queue (Auto in 3s)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Right Panel: Evidence & Suggestions */}
            <aside className="w-80 flex-shrink-0 border-l border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark overflow-y-auto">
                <div className="p-5 flex flex-col gap-8">
                    {/* AI Suggestions Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                                AI Suggestions
                            </h3>
                            <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">2 New</span>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group hover:border-primary/50 transition-all cursor-pointer">
                                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Strengthen Clinical Argument</p>
                                <p className="text-[11px] text-slate-500 mb-3 leading-snug">Case history suggests adding the MRI report dated 09/15 to confirm stenosis level.</p>
                                <button className="w-full py-1.5 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary hover:text-white transition-all">Apply Suggestion</button>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group hover:border-primary/50 transition-all cursor-pointer">
                                <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Missing Policy Citation</p>
                                <p className="text-[11px] text-slate-500 mb-3 leading-snug">Section 3.2 of BCBS policy 2023-A is relevant. Include citation?</p>
                                <button className="w-full py-1.5 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary hover:text-white transition-all">Add Citation</button>
                            </div>
                        </div>
                    </div>

                    {/* Evidence Attachments Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">attach_file</span>
                                Evidence Attachments
                            </h3>
                            <button className="text-primary text-[18px] hover:text-blue-600 transition-colors">
                                <span className="material-symbols-outlined">add_circle</span>
                            </button>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                                <input defaultChecked className="rounded border-slate-400 text-primary focus:ring-primary bg-transparent size-4" type="checkbox" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-900 dark:text-white">History & Physical</p>
                                    <p className="text-[10px] text-slate-500">PDF • 1.2 MB</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <input defaultChecked className="rounded border-slate-400 text-primary focus:ring-primary bg-transparent size-4" type="checkbox" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-900 dark:text-white">Operative Report</p>
                                    <p className="text-[10px] text-slate-500">PDF • 850 KB</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <input defaultChecked className="rounded border-slate-400 text-primary focus:ring-primary bg-transparent size-4" type="checkbox" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-900 dark:text-white">MRI Lumbar Spine</p>
                                    <p className="text-[10px] text-slate-500">DICOM Link • 45 MB</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors opacity-50">
                                <input className="rounded border-slate-400 text-primary focus:ring-primary bg-transparent size-4" type="checkbox" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-900 dark:text-white">PT Progress Notes</p>
                                    <p className="text-[10px] text-slate-500">Missing • Needs Upload</p>
                                </div>
                                <span className="material-symbols-outlined text-[16px] text-primary cursor-pointer">upload</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="mt-auto pt-6 border-t border-slate-200 dark:border-border-dark">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-slate-500">Estimated Settlement</span>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">$10,956.00</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] text-slate-500">Payer Processing Time</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">12-18 Days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
