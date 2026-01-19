import React from 'react';

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        console.log('DateTimePicker onChange:', val);
        onChange(val);
    };

    return (
        <input
            type="datetime-local"
            placeholder="Chọn ngày giờ"
            value={value}
            onChange={handleChange}
            style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                border: '2px solid rgba(102, 126, 234, 0.3)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                transition: 'border 0.2s, background 0.3s, color 0.3s',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
            }}
        />
    );
};

export default DateTimePicker;
