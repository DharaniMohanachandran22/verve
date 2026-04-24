'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function BrandLogo({
    className = '',
    size = 'large',
    href = '/dashboard'
}: {
    className?: string;
    size?: 'small' | 'large';
    href?: string;
}) {
    const isSmall = size === 'small';

    return (
        <Link
            href={href}
            className={`flex items-center tracking-tight transition-luxury hover:scale-105 ${isSmall ? 'gap-2 font-serif text-xl' : 'gap-3 font-serif text-2xl'} font-bold text-primary-dark ${className}`}
        >
            <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-success shadow-xl shadow-primary/30 ${isSmall ? 'h-8 w-8' : 'h-11 w-11'}`}>
                <Sparkles className={`${isSmall ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
            </div>
            <span className="bg-gradient-to-br from-primary-dark to-primary bg-clip-text text-transparent ml-0.5">Verve</span>
        </Link>
    );
}
