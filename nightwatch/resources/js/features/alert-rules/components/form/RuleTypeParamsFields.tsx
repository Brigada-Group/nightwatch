import type { AlertRuleFormState } from '../../types';
import { ErrorRateParamsFields } from './ErrorRateParamsFields';
import { NewExceptionClassParamsFields } from './NewExceptionClassParamsFields';

type Props = {
    form: AlertRuleFormState;
    onChange: (patch: Partial<AlertRuleFormState>) => void;
};

/**
 * Strategy dispatch: the form has different fields depending on rule type.
 * Each new rule type gets its own ParamsFields component and a switch arm
 * here. Keeps RuleBasicsFields and the dialog itself unaware of which
 * rule types exist.
 */
export function RuleTypeParamsFields({ form, onChange }: Props) {
    switch (form.type) {
        case 'error_rate':
            return <ErrorRateParamsFields form={form} onChange={onChange} />;
        case 'new_exception_class':
            return (
                <NewExceptionClassParamsFields
                    form={form}
                    onChange={onChange}
                />
            );
        default:
            return null;
    }
}
