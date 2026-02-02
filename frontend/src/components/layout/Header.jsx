import React from 'react';
import { useLocation } from 'react-router-dom';

export function Header() {
    const location = useLocation();

    const getTitle = () => {
        switch (location.pathname) {
            case '/': return 'Executive Revenue Dashboard';
            case '/claims-scrubbing': return 'Claim #99281 - Scrubbing Results';
            case '/ai-coding': return 'AI Coding Assistant';
            case '/claims-analytics': return 'Claims Analytics';
            case '/reporting': return 'Reporting';
            case '/insurance-verification': return 'Real-Time Eligibility';
            case '/patient-accounts': return 'Patient Registration';
            default: return 'RCM Platform';
        }
    };

    return (
        <header className="h-16 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark px-8 flex items-center justify-between sticky top-0 z-10 font-sans">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{getTitle()}</h2>
                <div className="h-6 w-px bg-slate-200 dark:bg-border-dark"></div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    <span>Oct 1 - Oct 31, 2023</span>
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <input
                        className="w-64 h-9 bg-slate-100 dark:bg-card-dark border-none rounded-lg text-sm pl-9 focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        placeholder="Search claims, patients..."
                        type="text"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-lg">search</span>
                </div>
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-card-dark rounded-full relative transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                </button>
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-card-dark border border-slate-300 dark:border-border-dark overflow-hidden">
                    <img
                        alt="User"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEQXhqD6212gqGThDt65-HV7FCmoCEyAh3ZlAEU4msNDaAEKTrHvQvwViWPUpJ0tp59z7xUGFdaKSQPDdKNHHO6rCYVHRrq-tWpRm-ekZe_pEBjOQGOGC-QNZwr55cIpBT1smM8wCyy8p6YlRQFy1uapbS3BLcUXijGzdpOJ-WGj-4ggV2Q2pKa5qjXp_STxOguMmwzn3EJ8C5SxCU-tdYHBVAocUAzA8Ib27G9RDhDRX0QPl_WOGdERe6IbmRQ1rGZ6a8d9lpmn58"
                    />
                </div>
            </div>
        </header>
    );
}
