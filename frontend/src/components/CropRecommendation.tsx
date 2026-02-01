import React, { useState } from 'react';
import { Sprout, Droplets, Thermometer, Wind, Activity } from 'lucide-react';
// import { useLanguage } from '../hooks/useLanguage';

export function CropRecommendation() {
    // const { t } = useLanguage(); -> Unused for now, using hardcoded English
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ crop: string; probability: number }[] | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('http://localhost:5001/api/crop/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recommendation');
            }

            const data = await response.json();
            if (data.success) {
                setResult(data.recommendations);
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
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <Sprout className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Crop Recommendation</h2>
                        <p className="text-gray-500">Get AI-powered crop suggestions based on soil and weather conditions</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" /> Nitrogen (N)
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
                                <Activity className="w-4 h-4 text-orange-500" /> Phosphorus (P)
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
                                <Activity className="w-4 h-4 text-yellow-500" /> Potassium (K)
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
                                <Thermometer className="w-4 h-4 text-red-500" /> Temperature (°C)
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
                                <Droplets className="w-4 h-4 text-blue-400" /> Humidity (%)
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
                                Soil pH
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
                                <Wind className="w-4 h-4 text-gray-400" /> Rainfall (mm)
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
                        {loading ? 'Analyzing...' : 'Get Recommendations'}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-8 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Top Recommendations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {result.map((item, index) => (
                                <div
                                    key={item.crop}
                                    className={`p-4 rounded-xl border ${index === 0
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
                    </div>
                )}
            </div>
        </div>
    );
}
