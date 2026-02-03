import { useState, useEffect } from 'react';
import { History, Trash2, Calendar, Leaf, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { cropDiseaseAPI, type DiseaseDetection } from '../services/apiService';
import { useLanguage } from '../hooks/useLanguage';

export function DiseaseHistory() {
    const [history, setHistory] = useState<DiseaseDetection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { language } = useLanguage();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to view disease detection history');
                setIsLoading(false);
                return;
            }

            const data = await cropDiseaseAPI.getDiseaseHistory(20);
            setHistory(data);
        } catch (err: any) {
            console.error('Failed to load disease history:', err);

            // Provide specific error messages
            if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
            } else if (err.response?.status === 404) {
                setError('Disease history endpoint not found');
            } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                setError('Cannot connect to server. Please check if backend is running.');
            } else {
                setError('Failed to load disease history. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const deleteDetection = async (id: string) => {
        if (!confirm('Delete this detection?')) return;

        try {
            await cropDiseaseAPI.deleteDiseaseDetection(id);
            setHistory(prev => prev.filter(d => d._id !== id));
        } catch (err) {
            console.error('Failed to delete detection:', err);
            alert('Failed to delete detection');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                    onClick={loadHistory}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No disease detections yet</p>
                <p className="text-sm mt-1">Upload crop images to detect diseases</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Disease Detection History ({history.length})</span>
            </h3>

            <div className="space-y-3">
                {history.map((detection) => {
                    const isExpanded = expandedId === detection._id;

                    return (
                        <div
                            key={detection._id}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Header with image and basic info */}
                            <div className="p-4">
                                <div className="flex items-start space-x-4">
                                    {/* Image thumbnail */}
                                    <div className="flex-shrink-0">
                                        {detection.imageUrl ? (
                                            <img
                                                src={detection.imageUrl}
                                                alt={detection.cropName}
                                                className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                <Leaf className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <h4 className="font-semibold text-gray-800">{detection.cropName}</h4>
                                            </div>
                                            <button
                                                onClick={() => deleteDetection(detection._id)}
                                                className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-start space-x-2 mb-2">
                                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-red-700">{detection.detectedDisease}</p>
                                                <p className="text-xs text-gray-500">Confidence: {detection.confidence}%</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(detection.detectionTimestamp).toLocaleDateString()}</span>
                                                <span>{new Date(detection.detectionTimestamp).toLocaleTimeString()}</span>
                                            </div>

                                            <button
                                                onClick={() => toggleExpand(detection._id)}
                                                className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium"
                                            >
                                                <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                                    {/* Full-size image */}
                                    {detection.imageUrl && (
                                        <div className="mb-4">
                                            <img
                                                src={detection.imageUrl}
                                                alt={detection.cropName}
                                                className="w-full max-h-64 object-contain rounded-lg border border-gray-300"
                                            />
                                        </div>
                                    )}

                                    {/* Symptoms */}
                                    {detection.symptoms && detection.symptoms.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-gray-700 mb-2">Symptoms:</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                {detection.symptoms.map((symptom, idx) => (
                                                    <li key={idx}>{symptom}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Treatment */}
                                    {detection.treatment && (
                                        <div>
                                            <h5 className="font-semibold text-gray-700 mb-2">Treatment:</h5>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{detection.treatment}</p>
                                        </div>
                                    )}

                                    {/* Prevention Tips */}
                                    {detection.preventionTips && detection.preventionTips.length > 0 && (
                                        <div>
                                            <h5 className="font-semibold text-gray-700 mb-2">Prevention Tips:</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                {detection.preventionTips.map((tip, idx) => (
                                                    <li key={idx}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Location if available */}
                                    {detection.location && (
                                        <div className="text-xs text-gray-500 pt-2 border-t">
                                            <span className="font-medium">Location:</span> {detection.location.address || `${detection.location.latitude}, ${detection.location.longitude}`}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
