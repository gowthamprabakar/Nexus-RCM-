import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100">
            <div className="sticky top-0 h-screen shrink-0 overflow-y-auto">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 flex flex-col">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
