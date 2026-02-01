import React from 'react';
import { Input, InputProps } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { validatePattern } from '@/utils/validators';

interface PatternInputProps {
    label: string;
    patterns: string[];
    onPatternsChange: (patterns: string[]) => void;
    className?: string;
}

export function PatternInput({ label, patterns, onPatternsChange, className }: PatternInputProps) {
    const [currentInput, setCurrentInput] = React.useState('');
    const [error, setError] = React.useState('');

    const handleAdd = () => {
        if (!currentInput) {
            setError('Pattern cannot be empty');
            return;
        }

        if (!validatePattern(currentInput)) {
            setError('Only Hex characters (0-9, a-f) allowed');
            return;
        }

        if (patterns.includes(currentInput)) {
            setError('Pattern already added');
            return;
        }

        onPatternsChange([...patterns, currentInput]);
        setCurrentInput('');
        setError('');
    };

    const handleRemove = (index: number) => {
        const newPatterns = patterns.filter((_, i) => i !== index);
        onPatternsChange(newPatterns);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCurrentInput(val);
        if (val && !validatePattern(val)) {
            setError('Only Hex characters (0-9, a-f) allowed');
        } else {
            setError('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className={className}>
            <Label className="mb-2 block text-gray-400">{label}</Label>

            {/* Pattern List */}
            {patterns.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {patterns.map((pattern, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/50 rounded px-3 py-1"
                        >
                            <span className="text-white font-mono text-sm">{pattern}</span>
                            <button
                                onClick={() => handleRemove(index)}
                                className="text-red-400 hover:text-red-300 text-lg font-bold"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Row */}
            <div className="flex gap-2">
                <Input
                    value={currentInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g. cafe, 8888"
                    className={`bg-black/40 border-gray-800 text-white placeholder:text-gray-600 focus:ring-blue-500/50 ${error ? 'border-red-500' : ''}`}
                />
                <Button
                    type="button"
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-500 text-white whitespace-nowrap"
                >
                    Add
                </Button>
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            {patterns.length === 0 && !error && (
                <p className="text-gray-500 text-xs mt-1">Add at least one pattern</p>
            )}
        </div>
    );
}
