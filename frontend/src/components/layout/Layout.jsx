import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout() {
    return (
        <div className="flex min-h-screen bg-th-surface-base font-sans text-th-primary transition-colors duration-200">
            <div className="sticky top-0 h-screen shrink-0">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-y-auto bg-th-surface-base p-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
