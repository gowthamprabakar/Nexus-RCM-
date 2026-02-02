import React from 'react';
import { Outlet } from 'react-router-dom';

export function AICodingLayout() {
    return (
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] font-sans text-slate-900 dark:text-white">
            <Outlet />
        </div>
    );
}
