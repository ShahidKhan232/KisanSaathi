import React, { useState, useEffect } from 'react';
import { Sprout, Droplets, Thermometer, Wind, Activity, History, X, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cropRecommendationAPI, type CropRecommendationRecord } from '../services/apiService';

export function CropRecommendation() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ crop: string; probability: number }[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedToDb, setSavedToDb] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<CropRecommendationRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // AuthContext stores JWT under 'auth_token' key
    const isAuthenticated = !!(localStorage.getItem('auth_token') || localStorage.getItem('token'));

    const [formData, setFormData] = useState({
        N: 50,
        P: 50,
        K: 50,
        temperature: 25.0,
        humidity: 70.0,
        ph: 6.5,
        rainfall: 150.0,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: parseFloat(value),
        }));
    };

    const fetchHistory = async () => {
        if (!isAuthenticated) return;
        try {
            setHistoryLoading(true);
            const data = await cropRecommendationAPI.getHistory(10);
            setHistory(data);
        } catch (err) {
            console.error('Failed to fetch recommendation history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        setSavedToDb(false);

        try {
            // Use authenticated apiService — auto-sends JWT token so server can save to DB
            const data = await cropRecommendationAPI.recommend(formData);

            if (data.success) {
                setResult(data.recommendations || []);
                // If we got recommendations and user is authenticated, the server has already saved it
                if (isAuthenticated) {
                    setSavedToDb(true);
                    console.log('✅ Recommendation saved to database via server');
                    // Refresh history in background
                    fetchHistory();
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Sprout className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{t('cropRecommendation')}</h2>
                            <p className="text-gray-500">{t('aiCropSuggestions')}</p>
                        </div>
                    </div>
                    {isAuthenticated && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${
                                showHistory
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            <History className="w-4 h-4" />
                            <span>{showHistory ? 'Hide History' : 'View History'}</span>
                        </button>
                    )}
                </div>

                {/* History Panel */}
                {showHistory && isAuthenticated && (
                    <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                                <History className="w-4 h-4 text-green-600" />
                                <span>Past Recommendations (saved in DB)</span>
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {historyLoading ? (
                            <p className="text-sm text-gray-500 text-center py-4">Loading history...</p>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No past recommendations found.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {history.map((rec) => (
                                    <div key={rec._id} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-green-700 capitalize">{rec.recommendedCrop}</p>
                                            <p className="text-xs text-gray-500">
                                                N:{rec.nitrogen} P:{rec.phosphorus} K:{rec.potassium} | pH:{rec.ph} | {rec.rainfall}mm
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {rec.confidence !== undefined && (
                                                <span className="text-sm font-bold text-green-600">{rec.confidence.toFixed(1)}%</span>
                                            )}
                                            <p className="text-xs text-gray-400">
                                                {new Date(rec.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" /> {t('nitrogen')}
                            </label>
                            <input
                                type="number"
                                name="N"
                                value={formData.N}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-orange-500" /> {t('phosphorus')}
                            </label>
                            <input
                                type="number"
                                name="P"
                                value={formData.P}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-yellow-500" /> {t('potassium')}
                            </label>
                            <input
                                type="number"
                                name="K"
                                value={formData.K}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-red-500" /> {t('temperatureC')}
                            </label>
                            <input
                                type="number"
                                name="temperature"
                                step="0.1"
                                value={formData.temperature}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-blue-400" /> {t('humidityPercent')}
                            </label>
                            <input
                                type="number"
                                name="humidity"
                                step="0.1"
                                value={formData.humidity}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                {t('soilPh')}
                            </label>
                            <input
                                type="number"
                                name="ph"
                                step="0.1"
                                value={formData.ph}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Wind className="w-4 h-4 text-gray-400" /> {t('rainfallMm')}
                            </label>
                            <input
                                type="number"
                                name="rainfall"
                                step="0.1"
                                value={formData.rainfall}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('analyzing') : t('getRecommendations')}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">{t('topRecommendations')}</h3>
                            {savedToDb && (
                                <div className="flex items-center space-x-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Saved to your history</span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {result.map((item, index) => (
                                <div
                                    key={item.crop}
                                    className={`p-4 rounded-xl border ${
                                        index === 0
                                            ? 'bg-green-50 border-green-200 ring-1 ring-green-100'
                                            : 'bg-white border-gray-100'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white text-gray-600 border border-gray-100">
                                            #{index + 1}
                                        </span>
                                        <span className="text-sm font-bold text-green-600">{item.probability}%</span>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 capitalize">{item.crop}</h4>
                                </div>
                            ))}
                        </div>
                        {!isAuthenticated && (
                            <p className="text-xs text-gray-400 text-center mt-2">
                                💡 Log in to save recommendations to your history
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
