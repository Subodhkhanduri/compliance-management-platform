interface BadgeProps {
    value: boolean;
    trueLabel?: string;
    falseLabel?: string;
}

export function Badge({
    value,
    trueLabel = '✅ Compliant',
    falseLabel = '❌ Non-compliant',
}: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${value
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
        >
            {value ? trueLabel : falseLabel}
        </span>
    );
}
