import SearchableSelect from '@/components/ui/searchable-select';
import { AssessmentSetup } from '../types/assessment';

export type RoleSelectionProps = {
    roles: string[];
    setup: AssessmentSetup;
    setSetup: React.Dispatch<React.SetStateAction<AssessmentSetup>>;
}

export default function RoleSelection({ roles, setup, setSetup }: RoleSelectionProps) {
    return (
        <div className="w-full mx-auto mt-6 p-6 bg-card rounded-xl border border-border/80">
            <h2 className="text-lg font-semibold text-foreground mb-1">
                Role Selection
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Choose the role you want to prepare for
            </p>

            <SearchableSelect
                value={setup.role}
                options={roles}
                onChange={(value) => {
                    setSetup((prev) => ({
                        ...prev,
                        role: value,
                    }));
                }}
            />
        </div>
    );
}
