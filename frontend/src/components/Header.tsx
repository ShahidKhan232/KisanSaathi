import { Sprout, Globe, Volume2, LogIn, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useVoice } from '../hooks/useVoice';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { i18n, t } = useTranslation();
  const { isVoiceEnabled, toggleVoice } = useVoice();
  const { user, logout } = useAuth();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-800">Kisanसाथी</h1>
              <p className="text-xs text-green-600">{t('tagline')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-full transition-colors ${isVoiceEnabled
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-600'
                }`}
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <div className="relative">
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value as 'en' | 'hi' | 'mr')}
                className="appearance-none bg-green-50 text-green-700 px-3 py-2 pr-8 rounded-lg text-sm font-medium border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600 pointer-events-none" />
            </div>

            {user ? (
              <button
                onClick={logout}
                className="ml-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100"
                title={t('logout')}
              >
                <LogOut className="inline w-4 h-4 mr-1" /> {t('logout')}
              </button>
            ) : (
              <span className="hidden sm:flex items-center space-x-2 ml-2 text-sm text-gray-600">
                <LogIn className="w-4 h-4" />
                <span>{t('loginToSave')}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}