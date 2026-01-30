import React from 'react';
import { Input, InputProps } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { validatePattern } from '@/utils/validators';

interface PatternInputProps extends InputProps {
    label: string;
    onValidChange: (value: string) => void;
}

export function PatternInput({ label, onValidChange, className, ...props }: PatternInputProps) {
    const [error, setError] = React.useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || validatePattern(val)) {
            setError('');
            onValidChange(val);
        } else {
            setError('Only Hex characters (0-9, a-f) allowed');
        }
    };

    return (
        <div className={className}>
            <Label className="mb-2 block">{label}</Label>
            <Input 
                {...props}
                onChange={handleChange}
                className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
