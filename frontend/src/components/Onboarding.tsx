import { useState } from 'react';
import { Sprout, MapPin, Phone, Ruler, ChevronRight, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const CROPS_OPTIONS = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean',
  'Sugarcane', 'Tomato', 'Onion', 'Potato', 'Groundnut',
  'Mustard', 'Sunflower', 'Pulses', 'Millet', 'Barley'
];

interface OnboardingProps {
  onComplete: () => void;
}

interface ProfileData {
  name: string;
  phone: string;
  location: string;
  landSize: string;
  crops: string[];
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { token, user } = useAuth();
  const backendUrl = (import.meta as ImportMeta).env?.VITE_SERVER_URL ?? 'http://localhost:5001';

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<ProfileData>({
    name: user?.name ?? '',
    phone: '',
    location: '',
    landSize: '',
    crops: [],
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const toggleCrop = (crop: string) => {
    setData(prev => ({
      ...prev,
      crops: prev.crops.includes(crop)
        ? prev.crops.filter(c => c !== crop)
        : [...prev.crops, crop],
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          location: data.location,
          landSize: data.landSize,
          crops: data.crops,
          profileComplete: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      onComplete();
    } catch (err) {
      setError('Could not save your profile. Please check your connection and try again.');
      // Do NOT auto-dismiss — let the user retry so profileComplete is actually saved
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-green-100 rounded-xl">
              <Sprout className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome to KisanSaathi!</h2>
              <p className="text-sm text-gray-500">Step {step} of {totalSteps} — Let's set up your farm profile</p>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4 min-h-[280px]">

          {/* Step 1 — Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  👤 Your Name
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Mobile Number
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={e => setData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Farm Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Village / Town / District
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={e => setData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Ruler className="w-4 h-4" /> Land Size
                </label>
                <input
                  type="text"
                  value={data.landSize}
                  onChange={e => setData(prev => ({ ...prev, landSize: e.target.value }))}
                  placeholder="e.g. 5 acres, 2 hectares"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Crops */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">🌾 Select your main crops (can choose multiple)</p>
              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                {CROPS_OPTIONS.map(crop => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      data.crops.includes(crop)
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {data.crops.includes(crop) && '✓ '}{crop}
                  </button>
                ))}
              </div>
              {data.crops.length > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ✅ {data.crops.length} crop{data.crops.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={onComplete}
                className="text-xs underline whitespace-nowrap text-amber-600 hover:text-amber-800"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-0"
          >
            ← Back
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i + 1 <= step ? 'w-5 bg-green-500' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-[0.97] transition-all shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 active:scale-[0.97] transition-all shadow-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : (<><CheckCircle className="w-4 h-4" /> Finish</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
