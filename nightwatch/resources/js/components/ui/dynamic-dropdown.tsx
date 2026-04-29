import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type DynamicDropdownItem = {
    value: string;
    label: string;
    disabled?: boolean;
};

type DynamicDropdownProps = {
    items: DynamicDropdownItem[];
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
};

export function DynamicDropdown({
    items,
    value,
    onValueChange,
    placeholder = 'Select an option',
    disabled = false,
    className,
    triggerClassName = 'w-full',
}: DynamicDropdownProps) {
    const selectedValue = value && items.some((item) => item.value === value) ? value : undefined;

    return (
        <Select value={selectedValue} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={triggerClassName}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={className}>
                {items.map((item) => (
                    <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
