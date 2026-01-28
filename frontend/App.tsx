import { useState } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ChatBot } from './components/ChatBot';
import { CropDiseaseDetection } from './components/CropDiseaseDetection';
import { PricePrediction } from './components/PricePrediction';
import { SchemeRecommendations } from './components/SchemeRecommendations';
import { CropRecommendation } from './components/CropRecommendation';
import { Profile } from './components/Profile';
import { Landing } from './components/Landing';
import { LanguageProvider } from './contexts/LanguageContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

type ActiveTab = 'dashboard' | 'disease' | 'prices' | 'schemes' | 'profile' | 'recommendation';

function AppInner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { user, loading } = useAuth();

  return (
    <LanguageProvider>
      <VoiceProvider>
        <div className="min-h-screen bg-gray-50">
          {user && <Header />}
          <main className="pb-20">
            {loading ? null : user ? (
              <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'disease' && <CropDiseaseDetection />}
                {activeTab === 'prices' && <PricePrediction />}
                {activeTab === 'schemes' && <SchemeRecommendations />}
                {activeTab === 'recommendation' && <CropRecommendation />}
                {activeTab === 'profile' && <Profile />}
              </>
            ) : (
              <Landing />
            )}
          </main>
          {user && <Navigation activeTab={activeTab} onTabChange={setActiveTab} />}
          <ChatBot />
        </div>
      </VoiceProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;