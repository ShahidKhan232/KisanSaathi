import { useState, useEffect } from 'react';
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
import { Onboarding } from './components/Onboarding';
import { VoiceProvider } from './contexts/VoiceContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

type ActiveTab = 'dashboard' | 'disease' | 'prices' | 'schemes' | 'profile' | 'recommendation';

function AppInner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { user, token, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const backendUrl = (import.meta as ImportMeta).env?.VITE_SERVER_URL ?? 'http://localhost:5001';

  // After login, check whether the user has completed their profile
  useEffect(() => {
    if (!user || !token) {
      setProfileChecked(false);
      setShowOnboarding(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Show onboarding if profile is not marked complete OR has no name/location set
          const isIncomplete = !data.profileComplete || (!data.name && !data.location && !data.phone);
          setShowOnboarding(isIncomplete);
        } else {
          // Profile fetch failed (404 / new user) — show onboarding
          setShowOnboarding(true);
        }
      } catch {
        // Network error — skip onboarding so user isn't stuck
        setShowOnboarding(false);
      } finally {
        setProfileChecked(true);
      }
    })();
  }, [user?.id, token]); // re-run when user changes (login/logout/switch account)

  // Don't render anything while auth or profile check is in flight
  if (loading || (user && !profileChecked)) return null;

  return (
    <VoiceProvider>
      <div className="min-h-screen bg-gray-50">
        {user && <Header />}
        <main className="pb-20">
          {!user ? (
            <Landing />
          ) : (
            <>
              {activeTab === 'dashboard'      && <Dashboard />}
              {activeTab === 'disease'        && <CropDiseaseDetection />}
              {activeTab === 'prices'         && <PricePrediction />}
              {activeTab === 'schemes'        && <SchemeRecommendations />}
              {activeTab === 'recommendation' && <CropRecommendation />}
              {activeTab === 'profile'        && <Profile />}
            </>
          )}
        </main>
        {user && <Navigation activeTab={activeTab} onTabChange={setActiveTab} />}
        <ChatBot />

        {/* Onboarding modal — shown as overlay above everything for new users */}
        {showOnboarding && user && (
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        )}
      </div>
    </VoiceProvider>
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