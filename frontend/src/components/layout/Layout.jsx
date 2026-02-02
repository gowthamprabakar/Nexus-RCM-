import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Header />
                <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
