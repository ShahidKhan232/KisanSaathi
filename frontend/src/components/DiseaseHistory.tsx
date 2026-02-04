import { useState, useEffect } from 'react';
import { History, Trash2, Leaf, AlertCircle, ChevronDown, Image as ImageIcon, Microscope, Shield, Activity, Clock, Download, Share2, Eye } from 'lucide-react';
import { cropDiseaseAPI, type DiseaseDetection } from '../services/apiService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function DiseaseHistory() {
    const [history, setHistory] = useState<DiseaseDetection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { i18n } = useTranslation();
    const { token, user } = useAuth();

    useEffect(() => {
        loadHistory();

        // Listen for detection saved events to refresh the history
        const handleDetectionSaved = () => {
            console.log('🔄 Detection saved event received, refreshing history...');
            loadHistory();
        };

        window.addEventListener('detectionSaved', handleDetectionSaved);

        return () => {
            window.removeEventListener('detectionSaved', handleDetectionSaved);
        };
    }, [token, user]); // Re-run when auth state changes

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Check if user is logged in using AuthContext
            if (!token || !user) {
                setError('Please log in to view disease detection history');
                setIsLoading(false);
                return;
            }

            console.log('🔐 User authenticated:', user.email, 'Token present:', !!token);

            const historyData = await cropDiseaseAPI.getDiseaseHistory();
            setHistory(historyData);
            console.log(`🌾 Loaded ${historyData.length} disease detections for user ${user.email}`);
        } catch (err) {
            console.error('Error loading disease history:', err);
            setError('Failed to load disease history. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteDetection = async (id: string) => {
        if (!confirm('Are you sure you want to delete this disease detection?')) {
            return;
        }

        try {
            await cropDiseaseAPI.deleteDiseaseDetection(id);
            setHistory(history.filter(d => d._id !== id));
            console.log(`🗑️ Deleted disease detection ${id}`);
        } catch (err) {
            console.error('Error deleting detection:', err);
            alert('Failed to delete detection');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // New action button functions
    const downloadReport = (detection: DiseaseDetection) => {
        // Create a downloadable report
        const report = {
            crop: detection.cropName,
            disease: detection.detectedDisease,
            confidence: detection.confidence,
            date: new Date(detection.detectedAt).toLocaleString(),
            symptoms: detection.symptoms.join(', '),
            treatment: detection.treatment,
            prevention: detection.preventionTips.join(', ')
        };

        const reportText = `
Crop Disease Detection Report
================================

Crop: ${report.crop}
Disease: ${report.disease}
Confidence: ${report.confidence}%
Date: ${report.date}

Symptoms:
${report.symptoms}

Treatment:
${report.treatment}

Prevention Tips:
${report.prevention}
`.trim();

        // Create and download file
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `disease-report-${detection.cropName}-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📄 Report downloaded successfully');
    };

    const shareDetection = (detection: DiseaseDetection) => {
        const shareText = `🌾 Crop Disease Detection\n\nCrop: ${detection.cropName}\nDisease: ${detection.detectedDisease}\nConfidence: ${detection.confidence}%\n\nSymptoms: ${detection.symptoms.slice(0, 2).join(', ')}\n\nTreatment: ${detection.treatment.substring(0, 100)}...`;

        if (navigator.share) {
            navigator.share({
                title: 'Crop Disease Detection',
                text: shareText
            }).catch(() => console.log('Share cancelled'));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Detection details copied to clipboard!');
            });
        }

        console.log('📤 Detection shared successfully');
    };

    const viewFullDetails = (detection: DiseaseDetection) => {
        // Create a modal or navigate to full details view
        const details = `
🌾 Full Disease Detection Details
=====================================

📅 Detection Date: ${new Date(detection.detectedAt).toLocaleString()}
🌱 Crop: ${detection.cropName}
🦠 Disease: ${detection.detectedDisease}
📊 Confidence: ${detection.confidence}%


Symptoms:
${detection.symptoms.map(s => `• ${s}`).join('\n')}

Treatment:
${detection.treatment}

Prevention Tips:
${detection.preventionTips.map(t => `• ${t}`).join('\n')}

${detection.location ? `📍 Location: ${detection.location.address || `${detection.location.latitude}, ${detection.location.longitude}`}` : ''}
`.trim();

        alert(details);
        console.log('👁️ Full details viewed');
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
            <div className="text-center py-12 px-6">
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Microscope className="w-12 h-12 text-white" />
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {i18n.language === 'en' ? 'No Disease Detections Yet' : i18n.language === 'mr' ? 'अजूनही कोणतेही रोग शोध नाहीत' : 'अभी तक कोई रोग पहचान नहीं हुई'}
                </h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
                    {i18n.language === 'en' 
                        ? 'Upload crop images to detect diseases and get AI-powered recommendations for treatment and prevention.'
                        : i18n.language === 'mr'
                            ? 'रोग शोधण्यासाठी पीक प्रतिमा अपलोड करा आणि उपचार आणि प्रतिबंधांसाठी AI-आधारित शिफारसी मिळवा.'
                            : 'रोग का पता लगाने के लिए फसल की छवियां अपलोड करें और उपचार और रोकथाम के लिए AI-संचालित सिफारिशें प्राप्त करें।'
                    }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span>{i18n.language === 'en' ? 'AI-Powered Detection' : i18n.language === 'mr' ? 'AI-आधारित शोध' : 'AI-संचालित पहचान'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Activity className="w-4 h-4" />
                        <span>{i18n.language === 'en' ? 'Real-time Analysis' : i18n.language === 'mr' ? 'रिअल-टाइम विश्लेषण' : 'रियल-टाइम विश्लेषण'}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <History className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {i18n.language === 'en' ? 'Disease Detection History' : i18n.language === 'mr' ? 'रोग शोध इतिहास' : 'रोग पहचान इतिहास'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {i18n.language === 'en' ? `${history.length} detection${history.length !== 1 ? 's' : ''} recorded` 
                                    : i18n.language === 'mr' ? `${history.length} शोध नोंदवले` 
                                    : `${history.length} पहचान दर्ज की गई`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            <Shield className="w-4 h-4" />
                            <span>{i18n.language === 'en' ? 'Protected' : i18n.language === 'mr' ? 'सुरक्षित' : 'सुरक्षित'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map((detection) => {
                    const isExpanded = expandedId === detection._id;
                    const confidenceColor = detection.confidence >= 80 ? 'green' : detection.confidence >= 60 ? 'yellow' : 'red';

                    return (
                        <div
                            key={detection._id}
                            className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        >
                            {/* Gradient border effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl"></div>
                            
                            {/* Card content */}
                            <div className="relative bg-white rounded-2xl overflow-hidden">
                                {/* Header with image and basic info */}
                                <div className="relative h-48 bg-gradient-to-br from-green-50 to-blue-50">
                                    {/* Disease image */}
                                    {detection.imageUrl ? (
                                        <img
                                            src={detection.imageUrl}
                                            alt={detection.cropName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Overlay with crop name */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Leaf className="w-5 h-5 text-white" />
                                                <h4 className="text-lg font-bold text-white">{detection.cropName}</h4>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <AlertCircle className="w-4 h-4 text-red-300" />
                                                <p className="text-white font-medium text-sm">{detection.detectedDisease}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Delete button */}
                                    <button
                                        onClick={() => deleteDetection(detection._id)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 transform"
                                        title={i18n.language === 'en' ? 'Delete detection' : i18n.language === 'mr' ? 'शोध हटवा' : 'पहचान हटाएं'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Content section */}
                                <div className="p-4 space-y-3">
                                    {/* Confidence badge */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 bg-${confidenceColor}-500 rounded-full animate-pulse`}></div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {i18n.language === 'en' ? 'Confidence' : i18n.language === 'mr' ? 'आत्मविश्वास' : 'विश्वास'}
                                            </span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-${confidenceColor}-100 text-${confidenceColor}-700`}>
                                            {detection.confidence}%
                                        </div>
                                    </div>

                                    {/* Date and time */}
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(detection.detectedAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{new Date(detection.detectedAt).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Expand/Collapse button */}
                                    <button
                                        onClick={() => toggleExpand(detection._id)}
                                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-blue-50 hover:from-green-100 hover:via-emerald-100 hover:to-blue-100 rounded-xl transition-all duration-300 border border-green-200 hover:border-green-300 hover:shadow-md group"
                                    >
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors duration-200">
                                            {isExpanded 
                                                ? (i18n.language === 'en' ? 'Hide Details' : i18n.language === 'mr' ? 'तपशील लपवा' : 'विवरण छिपाएं')
                                                : (i18n.language === 'en' ? 'View Details' : i18n.language === 'mr' ? 'तपशील पहा' : 'विवरण देखें')
                                            }
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500 group-hover:text-green-600 transition-colors duration-200">
                                                {isExpanded 
                                                    ? (i18n.language === 'en' ? 'Collapse' : i18n.language === 'mr' ? 'संक्षिप्त' : 'संक्षिप्त करें')
                                                    : (i18n.language === 'en' ? 'Expand' : i18n.language === 'mr' ? 'विस्तार' : 'विस्तार करें')
                                                }
                                            </span>
                                            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-5 h-5 text-green-600" />
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50 p-4 space-y-4">
                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
                                            <button
                                                onClick={() => downloadReport(detection)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>{i18n.language === 'en' ? 'Download Report' : i18n.language === 'mr' ? 'अहवाल डाउनलोड करा' : 'रिपोर्ट डाउनलोड करें'}</span>
                                            </button>
                                            <button
                                                onClick={() => shareDetection(detection)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                <span>{i18n.language === 'en' ? 'Share' : i18n.language === 'mr' ? 'शेअर करा' : 'शेयर करें'}</span>
                                            </button>
                                            <button
                                                onClick={() => viewFullDetails(detection)}
                                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>{i18n.language === 'en' ? 'Full View' : i18n.language === 'mr' ? 'पूर्ण दृश्य' : 'पूर्ण दृश्य'}</span>
                                            </button>
                                        </div>
                                        {/* Full-size image */}
                                        {detection.imageUrl && (
                                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                    src={detection.imageUrl}
                                                    alt={detection.cropName}
                                                    className="w-full h-48 object-contain bg-gray-100"
                                                />
                                            </div>
                                        )}

                                        {/* Symptoms */}
                                        {detection.symptoms && detection.symptoms.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                                    <span>{i18n.language === 'en' ? 'Symptoms' : i18n.language === 'mr' ? 'लक्षणे' : 'लक्षण'}</span>
                                                </h5>
                                                <ul className="space-y-1">
                                                    {detection.symptoms.map((symptom, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            <span className="text-sm text-gray-600">{symptom}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Treatment */}
                                        {detection.treatment && (
                                            <div>
                                                <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                                                    <Shield className="w-4 h-4 text-green-500" />
                                                    <span>{i18n.language === 'en' ? 'Treatment' : i18n.language === 'mr' ? 'उपचार' : 'उपचार'}</span>
                                                </h5>
                                                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                                                    {detection.treatment}
                                                </p>
                                            </div>
                                        )}

                                        {/* Prevention Tips */}
                                        {detection.preventionTips && detection.preventionTips.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                                                    <Activity className="w-4 h-4 text-blue-500" />
                                                    <span>{i18n.language === 'en' ? 'Prevention Tips' : i18n.language === 'mr' ? 'प्रतिबंध टिप्स' : 'रोकथाम टिप्स'}</span>
                                                </h5>
                                                <ul className="space-y-1">
                                                    {detection.preventionTips.map((tip, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            <span className="text-sm text-gray-600">{tip}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Location if available */}
                                        {detection.location && (
                                            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                                <span className="font-medium">{i18n.language === 'en' ? 'Location' : i18n.language === 'mr' ? 'स्थान' : 'स्थान'}:</span> {detection.location.address || `${detection.location.latitude}, ${detection.location.longitude}`}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

