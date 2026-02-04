import { useEffect, useState, useCallback } from 'react';
import { Award, ExternalLink, CheckCircle, Clock, FileText, Users, TrendingUp, Zap, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { SchemeRecommendationService } from '../services/schemeRecommendationService';
import { ApplicationProgressTracker } from './ApplicationProgressTracker';
import type { ApplicationProgress } from '../types/SchemeTypes';

interface Scheme {
  id: string;
  name: string;
  nameEn?: string;
  nameMr?: string;
  description: string;
  descriptionEn?: string;
  descriptionMr?: string;
  benefit: string;
  benefitEn?: string;
  benefitMr?: string;
  eligibility: string[];
  eligibilityEn?: string[];
  eligibilityMr?: string[];
  documents: string[];
  documentsEn?: string[];
  documentsMr?: string[];
  applicationStatus: 'available' | 'applied' | 'approved';
  deadline: string;
  category: 'subsidy' | 'loan' | 'insurance' | 'direct-benefit' | 'digital' | 'infrastructure';
  matchScore: number;
  reasonCodes?: string[];
  metrics?: {
    approvalRate: number;
    avgProcessingDays: number;
    beneficiariesCount: number;
    popularityScore: number;
  };
  progress?: ApplicationProgress;
  schemeId?: string;
  // New enhanced fields
  launchDate?: string;
  websiteUrl?: string;
  applicationSteps?: string[];
  applicationStepsEn?: string[];
  applicationStepsMr?: string[];
  successRate?: number;
  avgProcessingDays?: number;
  beneficiariesCount?: number;
  budgetAllocated?: string;
  regionalAvailability?: string[];
  lastUpdated?: string;
  features?: string[];
  featuresEn?: string[];
  featuresMr?: string[];
}

// Fetch schemes from backend API with language support
const fetchSchemes = async (language: 'en' | 'hi' | 'mr'): Promise<Scheme[]> => {
  try {
    const response = await fetch(`/api/schemes?language=${language}`);
    if (!response.ok) {
      throw new Error('Failed to fetch schemes');
    }
    const data = await response.json();

    // Transform backend data to match frontend expectations
    // Backend returns _id (MongoDB ObjectId) but frontend expects id
    return data.map((scheme: any) => ({
      ...scheme,
      id: scheme._id || scheme.schemeId, // Use _id as id, fallback to schemeId
      name: scheme.schemeName,
      description: scheme.description,
      benefit: scheme.benefits?.join(', ') || 'N/A',
      eligibility: scheme.eligibility || [],
      documents: scheme.documentsRequired || [],
      applicationStatus: scheme.applicationStatus || 'available' as const,
      deadline: scheme.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: mapCategory(scheme.category),
      matchScore: scheme.matchScore || 70,
      websiteUrl: scheme.websiteUrl,
      // Preserve all other fields from backend
      schemeId: scheme.schemeId,
      department: scheme.department,
      applicationProcess: scheme.applicationProcess,
      lastUpdated: scheme.lastUpdated,
      isActive: scheme.isActive
    }));
  } catch (error) {
    console.error('Error fetching schemes:', error);
    // Fallback to basic schemes if API fails
    return getFallbackSchemes();
  }
};

// Helper function to map backend category to frontend category type
const mapCategory = (backendCategory: string): 'subsidy' | 'loan' | 'insurance' | 'direct-benefit' | 'digital' | 'infrastructure' => {
  const categoryMap: Record<string, 'subsidy' | 'loan' | 'insurance' | 'direct-benefit' | 'digital' | 'infrastructure'> = {
    'Direct Benefit': 'direct-benefit',
    'Insurance': 'insurance',
    'Loan': 'loan',
    'Subsidy': 'subsidy',
    'Infrastructure': 'infrastructure',
    'Digital Services': 'digital'
  };
  return categoryMap[backendCategory] || 'subsidy';
};

// Fallback schemes for when API is unavailable
// Return empty array to show error state instead of hardcoded data
const getFallbackSchemes = (): Scheme[] => {
  console.error('API unavailable, returning empty schemes array');
  return [];
};

export function SchemeRecommendations() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile: userProfile, updateLandSize, addCrop, updateKCCStatus } = useUserProfile();
  const socket = useSocket();

  // Local state
  const [, setLoading] = useState(true);
  const [, setError] = useState<Error | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [showingProgressId, setShowingProgressId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSchemeForApplication, setSelectedSchemeForApplication] = useState<Scheme | null>(null);
  const [schemeLinks, setSchemeLinks] = useState<any[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState<{
    minBenefit: number;
    maxBenefit: number;
    deadline: string;
    complexity: string;
    status: string;
  }>({
    minBenefit: 0,
    maxBenefit: 1000000,
    deadline: 'all',
    complexity: 'all',
    status: 'all'
  });

  // Fetch scheme links on component mount
  useEffect(() => {
    const fetchSchemeLinks = async () => {
      try {
        const response = await fetch('/api/scheme-links');
        if (response.ok) {
          const links = await response.json();
          setSchemeLinks(links);
        }
      } catch (error) {
        console.error('Failed to fetch scheme links:', error);
      }
    };

    fetchSchemeLinks();
  }, []);

  const handleApplyClick = useCallback((scheme: Scheme) => {
    setSelectedSchemeForApplication(scheme);
    setShowApplicationModal(true);
  }, []);

  const handleDirectApply = useCallback(async (schemeId: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Get the scheme details
      const scheme = schemes.find(s => s.id === schemeId);
      if (!scheme) {
        console.error('Scheme not found');
        return;
      }

      // Prepare application data
      const applicationData = {
        applicantName: user.name || 'Anonymous User',
        applicantId: user.id,
        schemeId: schemeId,
        schemeName: scheme.name,
        appliedAt: new Date().toISOString(),
        documents: scheme.documents || [],
        category: scheme.category,
        expectedBenefit: scheme.benefit
      };

      const res = await fetch('/api/schemes/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          schemeId,
          applicationData,
          userId: user.id
        })
      });

      if (res.ok) {
        const response = await res.json();
        console.log('Application submitted successfully:', response);

        // Show success message to user
        alert(`Application submitted successfully!\nApplication Number: ${response.application.applicationNumber}\nEstimated Processing Time: ${response.application.estimatedProcessingDays} days`);

        // Socket will update UI when server confirms application
        socket.emit('scheme:apply', {
          schemeId,
          applicationNumber: response.application.applicationNumber,
          status: 'submitted'
        });
      } else {
        const errorData = await res.json();
        console.error('Application failed:', errorData);
        alert(`Application failed: ${errorData.message || 'Please try again later'}`);
      }
    } catch (err) {
      console.error('Failed to apply for scheme:', err);
      alert('Application failed: Network error. Please check your connection and try again.');
    }
  }, [socket, user, schemes]);

  const handleDocumentUpload = useCallback(async (documentId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/documents/${documentId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.id}`  // Using user ID as token for now
        },
        body: formData
      });

      if (res.ok) {
        socket.emit('document:upload', { documentId, status: 'uploaded' });
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
      socket.emit('document:upload', { documentId, status: 'failed' });
    }
  }, [socket, user]);

  // Recommendation service used inside effects where needed

  // Real-time updates for scheme status and documents
  useEffect(() => {
    type SchemeStatusEvent = {
      schemeId: string;
      status: 'available' | 'applied' | 'approved';
      progress: ApplicationProgress;
    };

    type DocumentStatusEvent = {
      schemeId: string;
      documentId: string;
      status: 'pending' | 'uploaded' | 'verified' | 'rejected';
    };

    const handleSchemeStatus = (data: SchemeStatusEvent) => {
      setSchemes(prev => prev.map(scheme =>
        scheme.id === data.schemeId ? {
          ...scheme,
          applicationStatus: data.status,
          progress: data.progress
        } : scheme
      ));
    };

    const handleDocumentStatus = (data: DocumentStatusEvent) => {
      setSchemes(prev => prev.map(scheme =>
        scheme.id === data.schemeId && scheme.progress ? {
          ...scheme,
          progress: {
            ...scheme.progress,
            documents: scheme.progress.documents.map(doc =>
              doc.id === data.documentId ? { ...doc, status: data.status } : doc
            )
          }
        } : scheme
      ));
    };

    socket.subscribe('scheme:status', handleSchemeStatus);
    socket.subscribe('document:status', handleDocumentStatus);

    return () => {
      socket.unsubscribe('scheme:status');
      socket.unsubscribe('document:status');
    };
  }, [socket]);

  // Initial load of schemes
  // Handle real-time scheme updates
  useEffect(() => {
    socket.subscribe<Scheme>('scheme:update', (scheme) => {
      setSchemes(prev => prev.map(s => s.id === scheme.id ? scheme : s));
    });

    return () => {
      socket.unsubscribe('scheme:update');
    };
  }, [socket]);

  // Load initial schemes data and get recommendations
  useEffect(() => {
    if (!userProfile || !user?.id) return;

    let isActive = true;
    const recommendationService = new SchemeRecommendationService();

    // Set initial loading state
    setLoading(true);
    setError(null);



    // Helper function to ensure language is one of the supported types
    const getValidLanguage = (lang: string): 'en' | 'hi' | 'mr' => {
      if (lang === 'en' || lang === 'hi' || lang === 'mr') {
        return lang;
      }
      return 'en'; // Default to English if language is not supported
    };

    const loadSchemes = async () => {
      try {
        setLoading(true);

        // Fetch schemes from backend API
        const schemes = await fetchSchemes(getValidLanguage(i18n.language));

        if (!isActive) return;

        // Process schemes with AI service
        const schemesForAI = schemes.map((scheme: Scheme) => ({
          id: scheme.id,
          eligibility: {
            landSizeRange: { min: 0, max: 5 },
            crops: i18n.language === 'en' ? ['Rice', 'Wheat'] : ['धान', 'गेहूं'],
            kccRequired: scheme.documents.some((d: string) => d.toLowerCase().includes('kcc')),
            incomeRange: { min: 0, max: 250000 },
            locations: []
          },
          metrics: scheme.metrics || {
            approvalRate: 0.85,
            avgProcessingDays: 15,
            beneficiariesCount: 1000000,
            popularityScore: 90
          }
        }));

        // Get AI recommendations
        const recs = await recommendationService.getRecommendations(userProfile, schemesForAI);

        // Merge recommendations with scheme data
        const schemesWithRecs = schemes.map((scheme: Scheme) => {
          const rec = recs.find(r => r.schemeId === scheme.id);
          return {
            ...scheme,
            matchScore: rec ? rec.matchScore : scheme.matchScore,
            reasonCodes: rec ? rec.reasonCodes : [],
            metrics: rec ? rec.metrics : scheme.metrics
          } as Scheme;
        });

        setSchemes(schemesWithRecs);
        setError(null);
      } catch (err) {
        if (isActive) {
          setError(err as Error);
          // Set empty schemes on error - no hardcoded fallback
          setSchemes([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadSchemes();

    return () => {
      isActive = false;
    };
  }, [userProfile, user, i18n.language]);

  const categories = [
    { value: 'all', label: t('allSchemes') },
    { value: 'direct-benefit', label: i18n.language === 'en' ? 'Direct Benefit' : i18n.language === 'mr' ? 'प्रत्यक्ष लाभ' : 'प्रत्यक्ष लाभ' },
    { value: 'subsidy', label: i18n.language === 'en' ? 'Subsidy' : i18n.language === 'mr' ? 'अनुदान' : 'सब्सिडी' },
    { value: 'loan', label: i18n.language === 'en' ? 'Loan' : i18n.language === 'mr' ? 'कर्ज' : 'लोन' },
    { value: 'insurance', label: i18n.language === 'en' ? 'Insurance' : i18n.language === 'mr' ? 'विमा' : 'बीमा' },
    { value: 'digital', label: i18n.language === 'en' ? 'Digital Services' : i18n.language === 'mr' ? 'डिजिटल सेवा' : 'डिजिटल सेवाएं' },
    { value: 'infrastructure', label: i18n.language === 'en' ? 'Infrastructure' : i18n.language === 'mr' ? 'पायाभूत सुविधा' : 'अवसंरचना' }
  ];

  const filteredSchemes = schemes.filter(scheme => {
    // Category filter
    if (selectedCategory !== 'all' && scheme.category !== selectedCategory) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        scheme.name.toLowerCase().includes(query) ||
        scheme.description.toLowerCase().includes(query) ||
        scheme.benefit.toLowerCase().includes(query) ||
        scheme.eligibility.some(e => e.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Advanced filters
    if (filters.status !== 'all' && scheme.applicationStatus !== filters.status) return false;

    const benefitAmount = parseInt(scheme.benefit.replace(/[^0-9]/g, '')) || 0;
    if (benefitAmount < filters.minBenefit || benefitAmount > filters.maxBenefit) return false;

    if (filters.deadline !== 'all') {
      const deadlineDate = new Date(scheme.deadline);
      const today = new Date();
      if (filters.deadline === 'week' && deadlineDate > new Date(today.setDate(today.getDate() + 7))) return false;
      if (filters.deadline === 'month' && deadlineDate > new Date(today.setMonth(today.getMonth() + 1))) return false;
    }

    // Complexity is determined by number of documents and eligibility criteria
    const complexity = scheme.documents.length + scheme.eligibility.length <= 3 ? 'easy' :
      scheme.documents.length + scheme.eligibility.length <= 6 ? 'medium' : 'hard';
    if (filters.complexity !== 'all' && complexity !== filters.complexity) return false;

    return true;
  }).sort((a, b) => b.matchScore - a.matchScore);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'applied': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'applied': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'approved') return i18n.language === 'en' ? 'Approved' : i18n.language === 'mr' ? 'मंजूर' : 'स्वीकृत';
    if (status === 'applied') return i18n.language === 'en' ? 'Applied' : i18n.language === 'mr' ? 'अर्ज केले' : 'आवेदित';
    return i18n.language === 'en' ? 'Available' : i18n.language === 'mr' ? 'उपलब्ध' : 'उपलब्ध';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'direct-benefit': return 'bg-green-100 text-green-800';
      case 'subsidy': return 'bg-blue-100 text-blue-800';
      case 'loan': return 'bg-purple-100 text-purple-800';
      case 'insurance': return 'bg-orange-100 text-orange-800';
      case 'digital': return 'bg-indigo-100 text-indigo-800';
      case 'infrastructure': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('governmentSchemes')}</h2>
        <p className="text-gray-600">{t('recommendedSchemes')}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={i18n.language === 'en' ? 'Search schemes...' : i18n.language === 'mr' ? 'योजना शोधा...' : 'योजनाएं खोजें...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${selectedCategory === category.value
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Benefit Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i18n.language === 'en' ? 'Benefit Range' : i18n.language === 'mr' ? 'लाभ श्रेणी' : 'लाभ सीमा'}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filters.minBenefit}
                  onChange={(e) => setFilters({ ...filters, minBenefit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  value={filters.maxBenefit}
                  onChange={(e) => setFilters({ ...filters, maxBenefit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i18n.language === 'en' ? 'Deadline' : i18n.language === 'mr' ? 'अंतिम मुदत' : 'समय सीमा'}
              </label>
              <select
                value={filters.deadline}
                onChange={(e) => setFilters({ ...filters, deadline: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">{i18n.language === 'en' ? 'All' : i18n.language === 'mr' ? 'सर्व' : 'सभी'}</option>
                <option value="week">{i18n.language === 'en' ? 'This Week' : i18n.language === 'mr' ? 'या आठवड्यात' : 'इस सप्ताह'}</option>
                <option value="month">{i18n.language === 'en' ? 'This Month' : i18n.language === 'mr' ? 'या महिन्यात' : 'इस महीने'}</option>
              </select>
            </div>

            {/* Application Complexity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i18n.language === 'en' ? 'Complexity' : i18n.language === 'mr' ? 'जटिलता' : 'जटिलता'}
              </label>
              <select
                value={filters.complexity}
                onChange={(e) => setFilters({ ...filters, complexity: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">{i18n.language === 'en' ? 'All' : i18n.language === 'mr' ? 'सर्व' : 'सभी'}</option>
                <option value="easy">{i18n.language === 'en' ? 'Easy' : i18n.language === 'mr' ? 'सोपी' : 'आसान'}</option>
                <option value="medium">{i18n.language === 'en' ? 'Medium' : i18n.language === 'mr' ? 'मध्यम' : 'मध्यम'}</option>
                <option value="hard">{i18n.language === 'en' ? 'Complex' : i18n.language === 'mr' ? 'जटिल' : 'जटिल'}</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i18n.language === 'en' ? 'Status' : i18n.language === 'mr' ? 'स्थिती' : 'स्थिति'}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">{i18n.language === 'en' ? 'All' : i18n.language === 'mr' ? 'सर्व' : 'सभी'}</option>
                <option value="available">{i18n.language === 'en' ? 'Available' : i18n.language === 'mr' ? 'उपलब्ध' : 'उपलब्ध'}</option>
                <option value="applied">{i18n.language === 'en' ? 'Applied' : i18n.language === 'mr' ? 'अर्ज केलेले' : 'आवेदित'}</option>
                <option value="approved">{i18n.language === 'en' ? 'Approved' : i18n.language === 'mr' ? 'मंजूर' : 'स्वीकृत'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSchemes.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-600">
          <p className="font-medium mb-1">{i18n.language === 'en' ? 'No matching schemes found' : i18n.language === 'mr' ? 'योग्य योजना आढळल्या नाहीत' : 'कोई मिलती-जुलती योजना नहीं मिली'}</p>
          <p className="text-sm">{i18n.language === 'en' ? 'Try changing category filters.' : i18n.language === 'mr' ? 'श्रेणी फिल्टर्स बदला.' : 'श्रेणी फिल्टर बदलें।'}</p>
        </div>
      )}

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSchemes.map((scheme) => (
          <div key={scheme.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{scheme.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(scheme.category)}`}>
                      {categories.find(c => c.value === scheme.category)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{scheme.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 font-medium">{scheme.benefit}</span>
                      <span className="text-blue-600 font-medium">
                        {i18n.language === 'en' ? `${scheme.matchScore}% match` : i18n.language === 'mr' ? `${scheme.matchScore}% जुळणी` : `${scheme.matchScore}% मेल`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${scheme.matchScore}%` }} />
                    </div>

                    {/* AI Insights */}
                    {scheme.metrics && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>
                              {Math.round(scheme.metrics.approvalRate * 100)}%
                              {i18n.language === 'en' ? ' approval rate' : i18n.language === 'mr' ? '% मंजुरी दर' : '% स्वीकृति दर'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {scheme.metrics.avgProcessingDays}
                              {i18n.language === 'en' ? ' days avg.' : i18n.language === 'mr' ? ' दिवस सरासरी' : ' दिन औसत'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Match Reasons */}
                    {scheme.reasonCodes && scheme.reasonCodes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scheme.reasonCodes.map((code, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            {code === 'LAND_SIZE_MATCH' ? t('landSizeMatch') :
                              code === 'CROP_MATCH' ? t('cropMatch') :
                                code === 'HIGH_APPROVAL_RATE' ? t('highSuccessRate') :
                                  code === 'QUICK_PROCESSING' ? t('quickProcessing') :
                                    code === 'POPULAR_SCHEME' ? t('popularScheme') :
                                      code === 'KCC_AVAILABLE' ? t('kccAvailable') :
                                        code === 'INCOME_ELIGIBLE' ? t('incomeEligible') :
                                          code === 'GOOD_APPROVAL_RATE' ? t('goodApprovalRate') :
                                            code === 'MODERATE_PROCESSING' ? t('moderateProcessing') :
                                              code === 'HIGHLY_POPULAR' ? t('highlyPopular') :
                                                code === 'LARGE_BENEFICIARY_BASE' ? t('largebeneficiaryBase') :
                                                  code === 'PROVEN_TRACK_RECORD' ? t('provenTrackRecord') :
                                                    code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scheme.applicationStatus)}`}>
                  {getStatusIcon(scheme.applicationStatus)}
                  <span>{getStatusLabel(scheme.applicationStatus)}</span>
                </div>
              </div>

              {/* Eligibility */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">{i18n.language === 'en' ? 'Eligibility' : i18n.language === 'mr' ? 'पात्रता' : 'योग्यता'}</h4>
                <ul className="space-y-1">
                  {scheme.eligibility.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documents */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">{i18n.language === 'en' ? 'Required Documents' : i18n.language === 'mr' ? 'आवश्यक कागदपत्रे' : 'आवश्यक दस्तावेज'}</h4>
                <div className="flex flex-wrap gap-2">
                  {scheme.documents.map((doc, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enhanced Information */}
              {(scheme.features || scheme.successRate || scheme.websiteUrl || scheme.beneficiariesCount) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    {t('additionalInformation')}
                  </h4>

                  {/* Features */}
                  {scheme.features && scheme.features.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {scheme.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Rate & Beneficiaries */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {scheme.successRate && (
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span>
                          {Math.round(scheme.successRate)}% {t('successRate')}
                        </span>
                      </div>
                    )}

                    {scheme.beneficiariesCount && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        <span>
                          {(scheme.beneficiariesCount / 100000).toFixed(1)}L {t('beneficiaries')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Website Links */}
                  {scheme.websiteUrl && (
                    <div className="mt-2 space-y-1">
                      <a
                        href={scheme.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{t('officialWebsite')}</span>
                      </a>

                      {/* Additional helpful links based on scheme type */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {scheme.id === '1' && ( // PM-KISAN
                          <>
                            <a
                              href="https://pmkisan.gov.in/BeneficiaryStatus.aspx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'Check Status' : i18n.language === 'mr' ? 'स्थिती तपासा' : 'स्थिति देखें'}
                            </a>
                            <a
                              href="https://pmkisan.gov.in/RegistrationForm.aspx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'Apply Online' : i18n.language === 'mr' ? 'ऑनलाइन अर्ज' : 'ऑनलाइन आवेदन'}
                            </a>
                          </>
                        )}

                        {scheme.id === '2' && ( // PMFBY
                          <>
                            <a
                              href="https://crop-insurance.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'Insurance Portal' : i18n.language === 'mr' ? 'विमा पोर्टल' : 'बीमा पोर्टल'}
                            </a>
                            <a
                              href="https://pmfby.gov.in/policystatus"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'Policy Status' : i18n.language === 'mr' ? 'पॉलिसी स्थिती' : 'पॉलिसी स्थिति'}
                            </a>
                          </>
                        )}

                        {scheme.id === '3' && ( // KCC
                          <>
                            <a
                              href="https://pmkisan.gov.in/KCCLink.aspx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'KCC Application' : i18n.language === 'mr' ? 'KCC अर्ज' : 'KCC आवेदन'}
                            </a>
                            <a
                              href="https://www.rbi.org.in/Scripts/FAQView.aspx?Id=1248"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'Guidelines' : i18n.language === 'mr' ? 'मार्गदर्शन' : 'दिशानिर्देश'}
                            </a>
                          </>
                        )}

                        {scheme.id === '4' && ( // e-NAM
                          <>
                            <a
                              href="https://enam.gov.in/web/registration"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'Register Now' : i18n.language === 'mr' ? 'आता नोंदणी करा' : 'अभी पंजीकरण करें'}
                            </a>
                            <a
                              href="https://enam.gov.in/web/fporegistration/home"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'FPO Registration' : i18n.language === 'mr' ? 'FPO नोंदणी' : 'FPO पंजीकरण'}
                            </a>
                          </>
                        )}

                        {scheme.id === '6' && ( // KUSUM
                          <>
                            <a
                              href="https://kusumyojana.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'Apply Portal' : i18n.language === 'mr' ? 'अर्ज पोर्टल' : 'आवेदन पोर्टल'}
                            </a>
                            <a
                              href="https://mnre.gov.in/solar/schemes/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'MNRE Portal' : i18n.language === 'mr' ? 'MNRE पोर्टल' : 'MNRE पोर्टल'}
                            </a>
                          </>
                        )}

                        {scheme.id === '7' && ( // MUDRA
                          <>
                            <a
                              href="https://www.mudra.org.in/Default/Download/2/23"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'Application Form' : i18n.language === 'mr' ? 'अर्ज फॉर्म' : 'आवेदन फॉर्म'}
                            </a>
                            <a
                              href="https://www.mudra.org.in/Default/UserControl"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'Track Application' : i18n.language === 'mr' ? 'अर्ज ट्रॅक करा' : 'आवेदन ट्रैक करें'}
                            </a>
                          </>
                        )}

                        {scheme.id === '8' && ( // Farm Mechanization
                          <>
                            <a
                              href="https://agrimachinery.nic.in/ApplicationForm.aspx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {i18n.language === 'en' ? 'Apply Online' : i18n.language === 'mr' ? 'ऑनलाइन अर्ज' : 'ऑनलाइन आवेदन'}
                            </a>
                            <a
                              href="https://agrimachinery.nic.in/ApplicationStatus.aspx"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:text-purple-800 underline"
                            >
                              {i18n.language === 'en' ? 'Check Status' : i18n.language === 'mr' ? 'स्थिती तपासा' : 'स्थिति देखें'}
                            </a>
                          </>
                        )}
                      </div>

                      {/* Helpline Information */}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          {scheme.id === '1' && ( // PM-KISAN
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:155261" className="text-blue-600 hover:text-blue-800">155261</a>
                              {' | '}
                              <a href="mailto:pmkisan-ict@gov.in" className="text-blue-600 hover:text-blue-800">pmkisan-ict@gov.in</a>
                            </span>
                          )}
                          {scheme.id === '2' && ( // PMFBY
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:18002007710" className="text-blue-600 hover:text-blue-800">1800-200-7710</a>
                              {' | '}
                              <a href="mailto:support@pmfby.gov.in" className="text-blue-600 hover:text-blue-800">support@pmfby.gov.in</a>
                            </span>
                          )}
                          {scheme.id === '3' && ( // KCC
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:18001801551" className="text-blue-600 hover:text-blue-800">1800-180-1551</a>
                              {' | '}
                              <a href="mailto:kcc-support@rbi.org.in" className="text-blue-600 hover:text-blue-800">kcc-support@rbi.org.in</a>
                            </span>
                          )}
                          {scheme.id === '4' && ( // e-NAM
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:18002700224" className="text-blue-600 hover:text-blue-800">1800-270-0224</a>
                              {' | '}
                              <a href="mailto:enamhelpdesk@gmail.com" className="text-blue-600 hover:text-blue-800">enamhelpdesk@gmail.com</a>
                            </span>
                          )}
                          {scheme.id === '6' && ( // KUSUM
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:18001803333" className="text-blue-600 hover:text-blue-800">1800-180-3333</a>
                              {' | '}
                              <a href="mailto:kusum-scheme@mnre.gov.in" className="text-blue-600 hover:text-blue-800">kusum-scheme@mnre.gov.in</a>
                            </span>
                          )}
                          {scheme.id === '7' && ( // MUDRA
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:18001807777" className="text-blue-600 hover:text-blue-800">1800-180-7777</a>
                              {' | '}
                              <a href="mailto:mudra@sidbi.in" className="text-blue-600 hover:text-blue-800">mudra@sidbi.in</a>
                            </span>
                          )}
                          {scheme.id === '8' && ( // Farm Mechanization
                            <span>
                              {i18n.language === 'en' ? 'Helpline: ' : i18n.language === 'mr' ? 'हेल्पलाइन: ' : 'हेल्पलाइन: '}
                              <a href="tel:18001801551" className="text-blue-600 hover:text-blue-800">1800-180-1551</a>
                              {' | '}
                              <a href="mailto:mechanization@dacnet.nic.in" className="text-blue-600 hover:text-blue-800">mechanization@dacnet.nic.in</a>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  <span>{i18n.language === 'en' ? 'Deadline:' : i18n.language === 'mr' ? 'अंतिम तारीख:' : 'अंतिम तिथि:'} </span>
                  <span className="font-medium">{new Date(scheme.deadline).toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'mr' ? 'mr-IN' : 'hi-IN')}</span>
                </div>

                {scheme.applicationStatus === 'available' ? (
                  <button
                    onClick={() => handleApplyClick(scheme)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{i18n.language === 'en' ? 'Apply Now' : i18n.language === 'mr' ? 'आता अर्ज करा' : 'आवेदन करें'}</span>
                  </button>
                ) : scheme.applicationStatus === 'applied' ? (
                  <>
                    <button
                      onClick={() => setShowingProgressId(showingProgressId === scheme.id ? null : scheme.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{i18n.language === 'en' ? 'View Status' : i18n.language === 'mr' ? 'स्थिती पाहा' : 'स्थिति देखें'}</span>
                    </button>
                    {showingProgressId === scheme.id && scheme.progress && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <ApplicationProgressTracker
                          progress={scheme.progress}
                          onUploadDocument={handleDocumentUpload}
                          onUpdateNotes={async (stepId, note) => {
                            try {
                              const res = await fetch(`/api/steps/${stepId}/notes`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${user?.id}`  // Using user ID as token for now
                                },
                                body: JSON.stringify({ note })
                              });

                              if (res.ok) {
                                socket.emit('step:note', { stepId, note });
                              }
                            } catch (err) {
                              console.error('Failed to add note:', err);
                            }
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <button className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 cursor-default">
                    <CheckCircle className="w-4 h-4" />
                    <span>{getStatusLabel('approved')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {i18n.language === 'en' ? 'Quick Actions' : t('quickActions')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-800">{i18n.language === 'en' ? 'Upload Documents' : 'दस्तावेज़ अपलोड'}</p>
              <p className="text-sm text-gray-600">{i18n.language === 'en' ? 'Prepare documents for application' : 'आवेदन के लिए दस्तावेज़ तैयार करें'}</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
            <Users className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-800">{i18n.language === 'en' ? 'Help Center' : 'सहायता केंद्र'}</p>
              <p className="text-sm text-gray-600">{i18n.language === 'en' ? 'Get help regarding schemes' : 'योजना संबंधी सहायता प्राप्त करें'}</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
            <Award className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-medium text-gray-800">{i18n.language === 'en' ? 'Eligibility Check' : 'योग्यता जांच'}</p>
              <p className="text-sm text-gray-600">{i18n.language === 'en' ? 'Check eligibility for new schemes' : 'नई योजनाओं की पात्रता देखें'}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedSchemeForApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {i18n.language === 'en' ? 'Apply for Scheme' : i18n.language === 'mr' ? 'योजनेसाठी अर्ज करा' : 'योजना के लिए आवेदन करें'}
                </h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {selectedSchemeForApplication.name}
                </h4>
                <p className="text-gray-600 mb-4">
                  {selectedSchemeForApplication.description}
                </p>
              </div>

              {/* Official Government Links */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-3">
                  {i18n.language === 'en' ? 'Official Government Resources' : i18n.language === 'mr' ? 'अधिकृत सरकारी संसाधने' : 'आधिकारिक सरकारी संसाधन'}
                </h5>

                {(() => {
                  const schemeLink = schemeLinks.find(link => link.id === selectedSchemeForApplication.id);
                  if (!schemeLink) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                        <a
                          href={schemeLink.officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {i18n.language === 'en' ? 'Official Website' : i18n.language === 'mr' ? 'अधिकृत वेबसाइट' : 'आधिकारिक वेबसाइट'}
                        </a>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-green-600" />
                        <a
                          href={schemeLink.applicationPortal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 underline"
                        >
                          {i18n.language === 'en' ? 'Application Portal' : i18n.language === 'mr' ? 'अर्ज पोर्टल' : 'आवेदन पोर्टल'}
                        </a>
                      </div>

                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-purple-600" />
                        <a
                          href={schemeLink.statusCheck}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 underline"
                        >
                          {i18n.language === 'en' ? 'Check Application Status' : i18n.language === 'mr' ? 'अर्जाची स्थिती तपासा' : 'आवेदन की स्थिति देखें'}
                        </a>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <a
                          href={schemeLink.documents}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-800 underline"
                        >
                          {i18n.language === 'en' ? 'Required Documents' : i18n.language === 'mr' ? 'आवश्यक कागदपत्रे' : 'आवश्यक दस्तावेज'}
                        </a>
                      </div>

                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-sm text-blue-800">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">
                              {i18n.language === 'en' ? 'Helpline:' : i18n.language === 'mr' ? 'हेल्पलाइन:' : 'हेल्पलाइन:'}
                            </span>
                            <a href={`tel:${schemeLink.helpline}`} className="text-blue-600 hover:text-blue-800">
                              {schemeLink.helpline}
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {i18n.language === 'en' ? 'Email:' : i18n.language === 'mr' ? 'ईमेल:' : 'ईमेल:'}
                            </span>
                            <a href={`mailto:${schemeLink.email}`} className="text-blue-600 hover:text-blue-800">
                              {schemeLink.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Application Options */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const schemeLink = schemeLinks.find(link => link.id === selectedSchemeForApplication.id);
                    if (schemeLink?.applicationPortal) {
                      window.open(schemeLink.applicationPortal, '_blank');
                    }
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>
                    {i18n.language === 'en' ? 'Apply on Official Portal' : i18n.language === 'mr' ? 'अधिकृत पोर्टलवर अर्ज करा' : 'आधिकारिक पोर्टल पर आवेदन करें'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowApplicationModal(false);
                    handleDirectApply(selectedSchemeForApplication.id);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>
                    {i18n.language === 'en' ? 'Apply Through Platform' : i18n.language === 'mr' ? 'प्लॅटफॉर्मद्वारे अर्ज करा' : 'प्लेटफॉर्म के माध्यम से आवेदन करें'}
                  </span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>
                    {i18n.language === 'en' ? 'Recommendation:' : i18n.language === 'mr' ? 'शिफारस:' : 'सुझाव:'}
                  </strong>
                  {' '}
                  {i18n.language === 'en'
                    ? 'We recommend applying through the official government portal for faster processing and direct government support.'
                    : i18n.language === 'mr'
                      ? 'जलद प्रक्रिया आणि थेट सरकारी सहाय्यासाठी आम्ही अधिकृत सरकारी पोर्टलद्वारे अर्ज करण्याची शिफारस करतो.'
                      : 'तेज़ प्रसंस्करण और प्रत्यक्ष सरकारी सहायता के लिए हम आधिकारिक सरकारी पोर्टल के माध्यम से आवेदन करने की सिफारिश करते हैं।'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
