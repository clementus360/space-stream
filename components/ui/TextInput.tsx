interface TextInputProps {
    name: string;
    label: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    errorMessage?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ name, value, label, type, placeholder, onChange, errorMessage }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <label htmlFor={name} className="text-primary">{label}</label>}
            <input name={name} value={value} type={type} placeholder={placeholder} onChange={onChange} className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary" />
            {errorMessage && <p className="text-red-400 text-sm">{errorMessage}</p>}
        </div>
    )
}