import { ReactNode } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
    return (
        <div className="relative group inline-block">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-300 shadow-xl z-50 text-center">
                {content}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
        </div>
    );
}
