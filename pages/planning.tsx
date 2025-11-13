import FinancialPlanning from '../components/pages/FinancialPlanning';
import { useAppContext } from '../context/AppContext';

export default function PlanningPage() {
    const { categories } = useAppContext();
    return (
        <FinancialPlanning categories={categories} />
    );
}
