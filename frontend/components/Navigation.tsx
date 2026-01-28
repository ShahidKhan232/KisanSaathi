import { Home, Camera, TrendingUp, Award, User, Sprout } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

type ActiveTab = 'dashboard' | 'disease' | 'prices' | 'schemes' | 'profile' | 'recommendation';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard' as const, icon: Home, label: t('dashboard') },
    { id: 'disease' as const, icon: Camera, label: t('diagnosis') },
    { id: 'prices' as const, icon: TrendingUp, label: t('prices') },
    { id: 'schemes' as const, icon: Award, label: t('schemes') },
    { id: 'recommendation' as const, icon: Sprout, label: 'Crop Rec.' },
    { id: 'profile' as const, icon: User, label: t('profile') }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${isActive
                ? 'bg-green-100 text-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}