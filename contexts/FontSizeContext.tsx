import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

interface FontSizeContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const fontSizeMap: Record<FontSize, string> = {
    small: '0.875rem',    // 14px
    medium: '1rem',       // 16px - default
    large: '1.125rem',    // 18px
    xlarge: '1.25rem',    // 20px
};

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        const saved = localStorage.getItem('neuroLift_fontSize') as FontSize;
        return (saved === 'small' || saved === 'medium' || saved === 'large' || saved === 'xlarge')
            ? saved
            : 'medium';
    });

    useEffect(() => {
        // Update CSS variable
        document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
        localStorage.setItem('neuroLift_fontSize', fontSize);
    }, [fontSize]);

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
    };

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
};

export const useFontSize = () => {
    const context = useContext(FontSizeContext);
    if (!context) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
};
