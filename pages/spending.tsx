import SpendingAnalysis from '../components/pages/SpendingAnalysis';
import { useAppContext } from '../context/AppContext';

export default function SpendingPage() {
    const { categories, categoriesLoading, categoriesError } = useAppContext();
    return (
        <SpendingAnalysis 
            categories={categories}
            loading={categoriesLoading}
            error={categoriesError}
        />
    );
}
