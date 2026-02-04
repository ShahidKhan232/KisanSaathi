import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Zap, CheckCircle, X, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { aiService } from '../services/aiService';
import { cropDiseaseAPI } from '../services/apiService';
import { DiseaseHistory } from './DiseaseHistory';
import ReactMarkdown from 'react-markdown';

interface DetectionResult {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
}

interface CropDiseaseDetectionProps {
  // No props needed anymore
}

// Function to format AI response into structured sections
const formatAIResponse = (response: string): JSX.Element => {
  console.log('Raw AI Response:', response); // Debug log

  const sections: { [key: string]: string[] } = {};
  let currentSection = '';
  let currentContent: string[] = [];

  const lines = response.split('\n');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) return;

    // Check for multiple section header patterns
    let sectionMatch: RegExpMatchArray | null = null;

    // Pattern 1: **1. Crop Identification:**
    sectionMatch = trimmedLine.match(/^\*\*(\d+)\.\s*([^*]+):\*\*(.*)$/);

    // Pattern 2: **Crop Identification:**
    if (!sectionMatch) {
      sectionMatch = trimmedLine.match(/^\*\*([^*:]+):\*\*(.*)$/);
      if (sectionMatch) {
        sectionMatch = [sectionMatch[0], '', sectionMatch[1], sectionMatch[2]]; // Adjust to match Pattern 1 structure
      }
    }

    // Pattern 3: **1. Crop:** or **2. Disease/Problem:** (shorter format)
    if (!sectionMatch) {
      sectionMatch = trimmedLine.match(/^\*\*(\d+)\.\s*([^*:]+):\*\*(.*)$/);
      if (sectionMatch) {
        sectionMatch = [sectionMatch[0], sectionMatch[1], sectionMatch[2], sectionMatch[3]]; // Adjust structure
      }
    }

    // Pattern 4: 1. Crop: (without asterisks)
    if (!sectionMatch) {
      sectionMatch = trimmedLine.match(/^(\d+)\.\s*([^:]+):(.*)$/);
      if (sectionMatch) {
        sectionMatch = [sectionMatch[0], sectionMatch[1], sectionMatch[2], sectionMatch[3]]; // Adjust structure
      }
    }

    if (sectionMatch) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent;
      }

      // Start new section
      currentSection = sectionMatch[2].trim();
      currentContent = [];

      // Add the content after the colon if any
      const afterColon = sectionMatch[3] ? sectionMatch[3].trim() : '';
      if (afterColon) {
        currentContent.push(afterColon);
      }

      console.log(`Found section: "${currentSection}" at line ${index}`); // Debug log
      return;
    }

    // Check for sub-headers (like "**Fungicide application:**")
    const subHeaderMatch = trimmedLine.match(/^\*\*([^*]+):\*\*(.*)$/);
    if (subHeaderMatch) {
      currentContent.push(`SUB_HEADER:${subHeaderMatch[1].trim()}`);
      const afterColon = subHeaderMatch[2].trim();
      if (afterColon) {
        currentContent.push(afterColon);
      }
      return;
    }

    // Regular content
    currentContent.push(trimmedLine);
  });

  // Save the last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent;
  }

  console.log('Parsed sections:', Object.keys(sections)); // Debug log

  // If no sections were found, treat the entire response as one section
  if (Object.keys(sections).length === 0) {
    sections['AI Analysis'] = lines.filter(line => line.trim());
  }

  // Define section icons and colors
  const getSectionIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('crop') || lowerTitle.includes('identification')) {
      return '🌱';
    } else if (lowerTitle.includes('disease') || lowerTitle.includes('symptom')) {
      return '🦠';
    } else if (lowerTitle.includes('cause')) {
      return '🔍';
    } else if (lowerTitle.includes('treatment')) {
      return '💊';
    } else if (lowerTitle.includes('prevention')) {
      return '🛡️';
    }
    return '📋';
  };

  const getSectionColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('crop') || lowerTitle.includes('identification')) {
      return 'bg-blue-50 border-blue-200';
    } else if (lowerTitle.includes('disease') || lowerTitle.includes('symptom')) {
      return 'bg-red-50 border-red-200';
    } else if (lowerTitle.includes('cause')) {
      return 'bg-yellow-50 border-yellow-200';
    } else if (lowerTitle.includes('treatment')) {
      return 'bg-green-50 border-green-200';
    } else if (lowerTitle.includes('prevention')) {
      return 'bg-purple-50 border-purple-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  // Extract key information for summary - handle different section name variations
  const findSection = (possibleNames: string[]) => {
    for (const name of possibleNames) {
      for (const sectionKey of Object.keys(sections)) {
        if (sectionKey.toLowerCase().includes(name.toLowerCase())) {
          return sections[sectionKey];
        }
      }
    }
    return [];
  };

  const cropInfo = findSection(['Crop Identification', 'crop', 'plant identification']);
  const diseaseInfo = findSection(['Disease', 'Problem Symptoms', 'symptoms', 'issue', 'diagnosis']);
  const treatmentInfo = findSection(['Treatment', 'cure', 'medicine', 'fungicide']);

  // If we only have one section (likely unstructured response), show it differently
  const sectionKeys = Object.keys(sections);
  const isUnstructured = sectionKeys.length === 1 && sectionKeys[0] === 'AI Analysis';

  return (
    <div className="space-y-6">
      {/* Quick Summary Card - only show if we have structured data */}
      {!isUnstructured && (cropInfo.length > 0 || diseaseInfo.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <span className="text-xl">📊</span>
            <span>Quick Summary</span>
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropInfo.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <h6 className="font-semibold text-blue-800 text-sm mb-1">🌱 Identified Crop</h6>
                <p className="text-gray-700 text-sm">{cropInfo[0]}</p>
              </div>
            )}
            {diseaseInfo.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <h6 className="font-semibold text-red-800 text-sm mb-1">🦠 Main Issue</h6>
                <p className="text-gray-700 text-sm">{diseaseInfo[0]}</p>
              </div>
            )}
            {treatmentInfo.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <h6 className="font-semibold text-green-800 text-sm mb-1">💊 Treatment Available</h6>
                <p className="text-gray-700 text-sm">Treatment recommendations provided</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Handle unstructured response differently */}
      {isUnstructured && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <span className="text-xl">🤖</span>
            <span>AI Analysis</span>
          </h5>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown
              components={{
                p: ({ children }: any) => <p className="mb-3 last:mb-0 text-sm leading-relaxed">{children}</p>,
                strong: ({ children }: any) => <strong className="font-bold text-gray-900">{children}</strong>,
                em: ({ children }: any) => <em className="text-blue-600 font-medium italic">{children}</em>,
                ul: ({ children }: any) => <ul className="list-disc list-inside mb-3 space-y-1.5 ml-2">{children}</ul>,
                ol: ({ children }: any) => <ol className="list-decimal list-inside mb-3 space-y-1.5 ml-2">{children}</ol>,
                li: ({ children }: any) => <li className="ml-2 text-sm">{children}</li>,
                h1: ({ children }: any) => <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                h2: ({ children }: any) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                h3: ({ children }: any) => <h3 className="text-sm font-semibold mb-2 mt-2">{children}</h3>,
                code: ({ children }: any) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-500 pl-3 italic my-3 text-gray-600">{children}</blockquote>,
              }}
            >
              {sections['AI Analysis'].join('\n\n')}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Show structured sections only if not unstructured */}
      {!isUnstructured && Object.entries(sections).map(([title, content], index) => (
        <div key={index} className={`border rounded-lg p-4 ${getSectionColor(title)}`}>
          <h5 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
            <span className="text-xl">{getSectionIcon(title)}</span>
            <span>{title}</span>
          </h5>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown
              components={{
                p: ({ children }: any) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                strong: ({ children }: any) => <strong className="font-bold text-gray-900">{children}</strong>,
                em: ({ children }: any) => <em className="text-blue-600 font-medium italic">{children}</em>,
                ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                li: ({ children }: any) => <li className="ml-2 text-sm">{children}</li>,
                h1: ({ children }: any) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                h2: ({ children }: any) => <h2 className="text-sm font-bold mb-2 mt-2">{children}</h2>,
                h3: ({ children }: any) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
                code: ({ children }: any) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">{children}</code>,
                blockquote: ({ children }: any) => <blockquote className="border-l-4 border-green-500 pl-3 italic my-2">{children}</blockquote>,
              }}
            >
              {content.join('\n\n')}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {/* Important Note Section - only show if we have structured content */}
      {!isUnstructured && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h5 className="text-lg font-semibold text-orange-800 mb-2 flex items-center space-x-2">
            <span className="text-xl">⚠️</span>
            <span>Important Reminder</span>
          </h5>
          <ul className="text-orange-700 text-sm space-y-1">
            <li>• Always follow label instructions when using any pesticide</li>
            <li>• Consult local agricultural experts for region-specific advice</li>
            <li>• Use preventive measures as the first line of defense</li>
            <li>• Regular monitoring helps catch diseases early</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export function CropDiseaseDetection({ }: CropDiseaseDetectionProps = {}) {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [aiTextResult, setAiTextResult] = useState<string | null>(null);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
        setAiTextResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    console.log('🎬 Camera start button clicked');
    setCameraError(null);

    try {
      // Check if getUserMedia is supported
      console.log('🔍 Checking camera support...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      console.log('✅ Camera support detected');

      console.log('📥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      console.log('✅ Camera stream obtained:', stream);
      setCameraStream(stream);
      setShowCamera(true);
      console.log('🎬 showCamera set to true, modal should appear');

      // Start video stream
      if (videoRef.current) {
        console.log('📹 Setting video stream...');
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        console.log('✅ Video stream started');
      } else {
        console.error('❌ videoRef.current is null');
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error);

      const errorMessage = i18n.language === 'en'
        ? 'Unable to access camera. Please check permissions or use gallery option.'
        : i18n.language === 'mr'
          ? 'कॅमेरा वापरू शकत नाही. कृपया परवानग्या तपासा किंवा गॅलरी पर्याय वापरा.'
          : 'कैमरा एक्सेस नहीं कर सका। कृपया अनुमतियां जांचें या गैलरी विकल्प का उपयोग करें।';

      setCameraError(errorMessage);
      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 image
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageDataUrl);
        setResult(null);
        setAiTextResult(null);

        // Close camera
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const analyzeImage = () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);

    // Call backend AI vision; fallback to mock on failure
    (async () => {
      try {
        const base64 = selectedImage.includes(',') ? selectedImage.split(',')[1] : selectedImage;
        const query = i18n.language === 'en'
          ? 'Identify crop and likely disease. Give symptoms, causes, treatments (safe doses), and prevention in simple bullet points.'
          : i18n.language === 'mr'
            ? 'पीक आणि संभाव्य रोग ओळखा. लक्षणे, कारणे, उपचार (सुरक्षित डोस) आणि प्रतिबंध साध्या बिंदूंमध्ये द्या.'
            : 'फसल और संभावित रोग पहचानें। लक्षण, कारण, उपचार (सुरक्षित मात्रा) और बचाव सरल बिंदुओं में दें।';

        console.log('Analyzing image with AI service...');
        const cacheStatsBefore = aiService.getCacheStats();
        console.log('Cache stats before analysis:', cacheStatsBefore);

        // Type guard to ensure language is one of the expected values
        const language: 'en' | 'mr' | 'hi' = ['en', 'mr', 'hi'].includes(i18n.language)
          ? i18n.language as 'en' | 'mr' | 'hi'
          : 'en';

        const text = await aiService.analyzeCropImage(base64, query, language);

        const cacheStatsAfter = aiService.getCacheStats();
        console.log('AI response received:', text.substring(0, 100) + '...');
        console.log('Cache stats after analysis:', cacheStatsAfter);

        // Check if this was a cached result
        const wasCached = cacheStatsBefore.size === cacheStatsAfter.size;
        setIsCachedResult(wasCached);

        // Check if this is a fallback response (contains warning message)
        const isFallbackResponse = text.includes('⚠️') || text.includes('सामान्य निदान');
        if (isFallbackResponse) {
          console.log('Fallback response detected - AI service was unavailable');
        }

        setAiTextResult(text);

        // Save disease detection to database
        try {
          const token = localStorage.getItem('token');
          if (token) {
            // Extract disease information from AI response
            const diseaseMatch = text.match(/(?:disease|problem|issue)[:\s]+([^\n.]+)/i);
            const cropMatch = text.match(/(?:crop|plant)[:\s]+([^\n.]+)/i);
            const treatmentMatch = text.match(/(?:treatment|cure|medicine)[:\s]+([^\n.]+)/i);

            // Extract symptoms (look for bullet points or numbered lists)
            const symptomsMatches = text.match(/(?:symptom|sign)[s]?[:\s]+([^\n]+(?:\n[-•*]\s*[^\n]+)*)/i);
            const symptoms: string[] = [];
            if (symptomsMatches && symptomsMatches[1]) {
              const symptomText = symptomsMatches[1];
              const bulletPoints = symptomText.match(/[-•*]\s*([^\n]+)/g);
              if (bulletPoints) {
                symptoms.push(...bulletPoints.map(s => s.replace(/^[-•*]\s*/, '').trim()));
              } else {
                symptoms.push(symptomText.trim());
              }
            }

            // Extract prevention tips
            const preventionMatches = text.match(/(?:prevention|prevent|avoid)[:\s]+([^\n]+(?:\n[-•*]\s*[^\n]+)*)/i);
            const preventionTips: string[] = [];
            if (preventionMatches && preventionMatches[1]) {
              const preventionText = preventionMatches[1];
              const bulletPoints = preventionText.match(/[-•*]\s*([^\n]+)/g);
              if (bulletPoints) {
                preventionTips.push(...bulletPoints.map(s => s.replace(/^[-•*]\s*/, '').trim()));
              } else {
                preventionTips.push(preventionText.trim());
              }
            }

            const dataToSave = {
              cropName: cropMatch ? cropMatch[1].trim() : 'Unknown',
              imageUrl: selectedImage,
              detectedDisease: diseaseMatch ? diseaseMatch[1].trim() : 'Disease detected',
              confidence: 85, // Default confidence since AI doesn't provide exact percentage
              symptoms: symptoms.length > 0 ? symptoms : ['Symptoms detected in image'],
              treatment: treatmentMatch ? treatmentMatch[1].trim() : text.substring(0, 200),
              preventionTips: preventionTips.length > 0 ? preventionTips : ['Follow recommended practices']
            };

            const savedDetection = await cropDiseaseAPI.saveDiseaseDetection(dataToSave);
            console.log('✅ Disease detection saved to database successfully!', savedDetection);

            // Trigger refresh of disease history
            setTimeout(() => {
              const event = new CustomEvent('detectionSaved', { detail: savedDetection });
              window.dispatchEvent(event);
            }, 500);
          }
        } catch (error) {
          console.error('❌ Failed to save disease detection to database:', error);
        }
      } catch (error) {
        console.error('Crop analysis error:', error);

        // Fallback to quick mock if AI not available
        const mockResults: DetectionResult[] = [
          {
            disease: 'धान का भूरा धब्बा (Brown Spot)',
            confidence: 85,
            treatment: 'प्रोपिकोनाज़ोल (Tilt 25 EC) का 1ml/लीटर पानी में स्प्रे करें। 15 दिन बाद दोबारा स्प्रे करें।',
            prevention: ['खेत में पानी का जमाव न होने दें', 'संतुलित खाद का प्रयोग करें', 'प्रमाणित बीज का उपयोग करें'],
            severity: 'medium'
          },
          {
            disease: 'टमाटर का पछेता झुलसा (Late Blight)',
            confidence: 92,
            treatment: 'मैंकोज़ेब (Dithane M-45) 2.5g/लीटर पानी में मिलाकर हर 10 दिन में स्प्रे करें।',
            prevention: ['हवा का अच्छा प्रवाह रखें', 'पत्तियों पर पानी न डालें', 'संक्रमित पत्तियों को हटा दें'],
            severity: 'high'
          }
        ];
        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
        setResult(randomResult);
        setAiTextResult(`**Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n\n**Fallback Diagnosis**:\n${randomResult.disease}`);

        // Save fallback detection to database
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const dataToSave = {
              cropName: 'Unknown',
              imageUrl: selectedImage,
              detectedDisease: randomResult.disease,
              confidence: randomResult.confidence,
              symptoms: ['Detected through fallback analysis'],
              treatment: randomResult.treatment,
              preventionTips: randomResult.prevention
            };

            const savedDetection = await cropDiseaseAPI.saveDiseaseDetection(dataToSave);
            console.log('✅ Fallback detection saved to database successfully!', savedDetection);

            // Trigger refresh of disease history
            setTimeout(() => {
              const event = new CustomEvent('detectionSaved', { detail: savedDetection });
              window.dispatchEvent(event);
            }, 500);
          }
        } catch (saveError) {
          console.error('❌ Failed to save fallback detection to database:', saveError);
        }
      } finally {
        setIsAnalyzing(false);
      }
    })();
  };

  const resetDetection = () => {
    setSelectedImage(null);
    setResult(null);
    setAiTextResult(null);
    setIsAnalyzing(false);
    setIsCachedResult(false);
    setCameraError(null);
    stopCamera(); // Ensure camera is stopped when resetting
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="relative mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{t('cropDiagnosis')}</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`absolute top-0 right-0 flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm ${showHistory
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            title={showHistory ? 'Hide history' : 'View disease detection history'}
          >
            <History className="w-4 h-4" />
            <span>{showHistory ? 'Hide History' : 'View History'}</span>
          </button>
        </div>
        <p className="text-gray-600">{t('cropCheckDescription')}</p>
      </div>

      {!selectedImage ? (
        <div className="relative overflow-hidden rounded-2xl shadow-premium animate-fadeIn">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 animate-gradient"></div>

          {/* Glassmorphism card */}
          <div className="relative glass rounded-2xl p-8 m-1">
            <div className="text-center space-y-6">
              {/* Icon with glow effect */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full blur-xl opacity-50 animate-pulse-slow"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto shadow-glow-md">
                  <Camera className="w-10 h-10 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-3">
                  {t('uploadImage')}
                </h3>
                <p className="text-gray-700 text-sm mb-4 font-medium">
                  {i18n.language === 'en' ? 'Upload photo in JPG, PNG or JPEG format (Max 5MB)' :
                    i18n.language === 'mr' ? 'JPG, PNG किंवा JPEG फॉर्मेटमध्ये फोटो अपलोड करा (जास्तीत जास्त 5MB)' :
                      'JPG, PNG या JPEG फॉर्मेट में फोटो अपलोड करें (अधिकतम 5MB)'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow-md overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <Upload className="w-5 h-5 relative z-10" />
                  <span className="font-semibold relative z-10">{i18n.language === 'en' ? 'Choose from Gallery' : i18n.language === 'mr' ? 'गॅलरीतून निवडा' : 'गैलरी से चुनें'}</span>
                </button>

                <button
                  onClick={startCamera}
                  className="group relative flex items-center justify-center space-x-2 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow-md overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <Camera className="w-5 h-5 relative z-10" />
                  <span className="font-semibold relative z-10">{t('takePhoto')}</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slideUp">
          {/* Image Preview */}
          <div className="glass rounded-2xl shadow-premium border border-white/50 p-6 relative">
            {/* Close button in corner */}
            <button
              onClick={resetDetection}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 shadow-md hover:shadow-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">{t('uploadedImage')}</h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/2">
                <div className="relative group overflow-hidden rounded-xl shadow-lg">
                  <img
                    src={selectedImage}
                    alt="Uploaded crop"
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>

              <div className="lg:w-1/2 space-y-4">
                {!result && !isAnalyzing && !aiTextResult && (
                  <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full blur-lg opacity-50"></div>
                      <Zap className="relative w-12 h-12 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {i18n.language === 'en' ? 'Ready for Analysis' : i18n.language === 'mr' ? 'विश्लेषणासाठी तयार' : 'विश्लेषण के लिए तैयार'}
                    </h4>
                    <p className="text-gray-600 mb-4">{t('cropCheckDescription')}</p>
                    <button
                      onClick={analyzeImage}
                      className="group relative bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-glow-md font-semibold overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      <span className="relative z-10">{t('analyzeNow')}</span>
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('analyzing')}</h4>
                    <p className="text-gray-600">{t('analyzingCrop')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Text Result - Formatted - Full Width Section */}
          {!isAnalyzing && aiTextResult && (
            <div ref={resultsRef} className="glass rounded-2xl shadow-premium border border-white/50 p-6 animate-fadeIn">
              <div className="text-left rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3 text-white rounded-t-xl">
                  <h4 className="text-lg font-semibold flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {i18n.language === 'en' ? 'AI Diagnosis Report' : i18n.language === 'mr' ? 'AI निदान रिपोर्ट' : 'AI निदान रिपोर्ट'}
                    </div>
                    {isCachedResult && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">
                        Cached
                      </span>
                    )}
                  </h4>
                </div>
                <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto bg-white rounded-b-xl">
                  {formatAIResponse(aiTextResult)}
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-t border-gray-200 rounded-b-xl">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 font-semibold">
                      {i18n.language === 'en' ? 'Consult Expert' : i18n.language === 'mr' ? 'तज्ञांशी सल्लामसलत करा' : 'विशेषज्ञ से सलाह लें'}
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white py-2 px-4 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 font-semibold">
                      {i18n.language === 'en' ? 'Order Medicine' : i18n.language === 'mr' ? 'औषध ऑर्डर करा' : 'दवाई ऑर्डर करें'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Results (old format) */}
          {!isAnalyzing && !aiTextResult && result && (
            <div className="glass rounded-2xl shadow-premium border border-white/50 p-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">{t('results')}</h3>
                </div>

                <div className="space-y-6">
                  {/* Disease Identification */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">पहचाना गया रोग</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(result.severity)}`}>
                          {result.severity === 'low' ? 'कम गंभीर' : result.severity === 'medium' ? 'मध्यम गंभीर' : 'अत्यधिक गंभीर'}
                        </span>
                        <span className="text-sm text-gray-600">{result.confidence}% निश्चितता</span>
                      </div>
                    </div>
                    <p className="text-lg text-gray-800 font-medium">{result.disease}</p>
                  </div>

                  {/* Treatment */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                      <span>उपचार</span>
                    </h4>
                    <p className="text-gray-700">{result.treatment}</p>
                  </div>

                  {/* Prevention */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">बचाव के तरीके</h4>
                    <ul className="space-y-2">
                      {result.prevention.map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors">
                      विशेषज्ञ से बात करें
                    </button>
                    <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors">
                      दवाई ऑर्डर करें
                    </button>
                    <button
                      onClick={resetDetection}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                    >
                      {i18n.language === 'en' ? 'Check New Photo' : i18n.language === 'mr' ? 'नवीन फोटो तपासा' : 'नई फोटो जांचें'}
                    </button>
                    {import.meta.env.DEV && (
                      <button
                        onClick={() => {
                          aiService.clearCache();
                          console.log('Cache cleared manually');
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition-colors text-sm"
                      >
                        Clear Cache (Dev)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Tips Section */}
          <div className="relative overflow-hidden rounded-2xl shadow-premium animate-fadeIn">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-50 via-primary-50 to-accent-100 animate-gradient"></div>
            <div className="relative glass rounded-2xl p-6 m-1">
              <h3 className="text-xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent mb-6">
                {i18n.language === 'en' ? '💡 Tips for Better Results' : i18n.language === 'mr' ? '💡 उत्तम परिणामांसाठी टिप्स' : '💡 बेहतर परिणाम के लिए टिप्स'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200">
                  <span className="w-6 h-6 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </span>
                  <span className="text-gray-700 text-sm font-medium">
                    {i18n.language === 'en' ? 'Take clear, sharp photos' : i18n.language === 'mr' ? 'स्वच्छ आणि स्पष्ट फोटो घ्या' : 'साफ और स्पष्ट फोटो लें'}
                  </span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200">
                  <span className="w-6 h-6 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </span>
                  <span className="text-gray-700 text-sm font-medium">
                    {i18n.language === 'en' ? 'Use natural lighting' : i18n.language === 'mr' ? 'नैसर्गिक प्रकाशात फोटो घ्या' : 'प्राकृतिक रोशनी में फोटो लें'}
                  </span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200">
                  <span className="w-6 h-6 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </span>
                  <span className="text-gray-700 text-sm font-medium">
                    {i18n.language === 'en' ? 'Show the diseased area close-up' : i18n.language === 'mr' ? 'रोगग्रस्त भाग जवळून दाखवा' : 'रोग ग्रस्त भाग को करीब से दिखाएं'}
                  </span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg hover:bg-white/70 transition-all duration-200">
                  <span className="w-6 h-6 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </span>
                  <span className="text-gray-700 text-sm font-medium">
                    {i18n.language === 'en' ? 'Include the full leaf or fruit' : i18n.language === 'mr' ? 'पान किंवा फळाचा पूर्ण भाग दाखवा' : 'पत्ती या फल का पूरा हिस्सा दिखाएं'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Disease History Section */}
          <div className="mt-8">
            <DiseaseHistory />
          </div>
        </div>
      )}

      {/* Camera Modal - Outside conditional blocks so it can show anytime */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="w-full h-full max-w-4xl max-h-screen flex flex-col">
            {/* Camera Header */}
            <div className="flex items-center justify-between p-4 glass-dark">
              <h3 className="text-white text-lg font-semibold flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>{i18n.language === 'en' ? 'Take Photo' : i18n.language === 'mr' ? 'फोटो काढा' : 'फोटो लें'}</span>
              </h3>
              <button
                onClick={stopCamera}
                className="text-white hover:text-red-400 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Camera View */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Camera Guidelines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full border-2 border-white/20 rounded-lg">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-lg">
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm">
                        {i18n.language === 'en' ? 'Focus the crop here' : i18n.language === 'mr' ? 'पीक येथे फोकस करा' : 'फसल को यहाँ फोकस करें'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="p-6 bg-black/50">
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {i18n.language === 'en' ? 'Cancel' : i18n.language === 'mr' ? 'रद्द करा' : 'रद्द करें'}
                </button>

                <button
                  onClick={capturePhoto}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex items-center space-x-2"
                >
                  <Camera className="w-6 h-6" />
                  <span className="font-semibold">
                    {i18n.language === 'en' ? 'Capture' : i18n.language === 'mr' ? 'कॅप्चर' : 'कैप्चर'}
                  </span>
                </button>

                <div className="w-16"></div> {/* Spacer for balance */}
              </div>

              <div className="mt-4 text-center">
                <p className="text-white/70 text-sm">
                  {i18n.language === 'en'
                    ? 'Position the diseased part of the crop within the frame and tap capture'
                    : i18n.language === 'mr'
                      ? 'फसलाचा रोगग्रस्त भाग फ्रेममध्ये ठेवा आणि कॅप्चर दाबा'
                      : 'फसल के रोगग्रस्त हिस्से को फ्रेम में रखें और कैप्चर दबाएं'}
                </p>
              </div>
            </div>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
