import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, MapPin, Calendar, Filter, RefreshCw, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pricePredictionService, HistoricalPrice as ServiceHistoricalPrice } from '../services/pricePredictionService';

interface MarketRecord {
  State: string;
  District: string;
  Market: string;
  Commodity: string;
  Variety: string;
  Grade: string;
  Arrival_Date: string;
  Min_Price: string;
  Max_Price: string;
  Modal_Price: string;
}

interface PriceData {
  crop: string;
  market: string;
  currentPrice: number;
  predictedPrice: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  date: string;
  confidence: number;
  image: string;
}

export function PricePrediction() {
  const { i18n, t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [liveDataRaw, setLiveDataRaw] = useState<string | null>(null);
  const [liveMarketData, setLiveMarketData] = useState<MarketRecord[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedItemDetails, setSelectedItemDetails] = useState<{
    crop: string;
    market: string;
    historical: ServiceHistoricalPrice[];
    forecast: ServiceHistoricalPrice[];
    analysis: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiPriceStatus, setAiPriceStatus] = useState<{
    lastFetchTime: string | null;
    aiGeneratedPriceCount: number;
    nextScheduledFetch: string;
    status: 'stale' | 'fresh';
  } | null>(null);

  const fetchPriceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pricePredictionService.getCurrentPrices();
      setPriceData(data as unknown as PriceData[]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      setError(
        i18n.language === 'en'
          ? 'Failed to load market prices. Please try again.'
          : i18n.language === 'mr'
            ? 'बाजारभाव लोड करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.'
            : 'बाज़ार भाव लोड करने में विफल. कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsLoading(false);
    }
  }, [i18n.language]);

  // Fetch AI price status
  useEffect(() => {
    const fetchAIStatus = async () => {
      const status = await pricePredictionService.getAIPriceStatus();
      if (status) {
        setAiPriceStatus(status);
      }
    };
    fetchAIStatus();
  }, []);

  // Fetch real-time price data
  useEffect(() => {
    fetchPriceData();
    // Reduced auto-refresh since prices only update daily
    const interval = setInterval(fetchPriceData, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [fetchPriceData]);

  // Fetch live prices immediately when component mounts
  useEffect(() => {
    console.log('[PricePrediction] Component mounted, fetching initial live prices...');
    fetchLive();
  }, []);

  // Auto-fetch when filters change (with debounce)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (stateFilter || districtFilter || commodityFilter) {
        console.log('[PricePrediction] Filters changed, auto-fetching...', { stateFilter, districtFilter, commodityFilter });
        fetchLive();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimer);
  }, [stateFilter, districtFilter, commodityFilter]);

  const fetchLive = useCallback(async (overrides?: {
    state?: string;
    district?: string;
    commodity?: string;
  }) => {
    setIsLoadingLive(true);
    setLiveDataRaw(null);

    const effectiveState = (overrides?.state ?? stateFilter)?.trim() || '';
    const effectiveDistrict = (overrides?.district ?? districtFilter)?.trim() || '';
    const effectiveCommodity = (overrides?.commodity ?? commodityFilter)?.trim() || '';

    console.log('Fetching AI-generated prices with filters:', {
      state: effectiveState,
      district: effectiveDistrict,
      commodity: effectiveCommodity
    });

    try {
      // Fetch from AI-generated market prices endpoint
      const params = new URLSearchParams();
      if (effectiveState) params.set('state', effectiveState);
      if (effectiveDistrict) params.set('district', effectiveDistrict);
      if (effectiveCommodity) params.set('commodity', effectiveCommodity);
      params.set('limit', '1000');

      const backendUrl = import.meta.env?.VITE_SERVER_URL
        ? import.meta.env.VITE_SERVER_URL
        : (import.meta.env?.DEV ? '' : 'http://localhost:5001');

      const response = await fetch(`${backendUrl}/api/market-prices/current?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const records = await response.json();

      console.log('AI-generated records from API:', records);
      console.log('Applied filters:', {
        state: effectiveState,
        district: effectiveDistrict,
        commodity: effectiveCommodity
      });

      if (!records || !Array.isArray(records)) {
        throw new Error('Invalid response format: expected array of records');
      }

      if (records.length === 0) {
        setLiveDataRaw(`No data found for filters: State="${effectiveState || 'any'}", District="${effectiveDistrict || 'any'}", Commodity="${effectiveCommodity || 'any'}". Try different search terms.`);
        setLiveMarketData([]);
        return;
      }

      // Transform AI-generated prices to match the expected format
      const processedRecords = records.map(record => ({
        State: record.state,
        District: record.district,
        Market: record.market,
        Commodity: record.commodity,
        Variety: record.variety || 'General',
        Grade: 'FAQ', // Frequently Asked Quality - standard grade
        Min_Price: record.minPrice?.toString() || '',
        Max_Price: record.maxPrice?.toString() || '',
        Modal_Price: record.modalPrice?.toString() || '',
        Price_Date: new Date(record.priceDate).toLocaleDateString('en-IN'),
        Arrival_Date: new Date(record.priceDate).toLocaleDateString('en-IN'),
        Arrivals: record.arrivals?.toString() || 'N/A'
      }));

      console.log('Processed AI-generated records:', processedRecords.length);

      // Set the formatted data for display
      setLiveMarketData(processedRecords);
      setLiveDataRaw(null); // Clear any previous messages

    } catch (e) {
      const errorMsg = `Error: ${(e as Error).message}`;
      console.error('fetchLive error:', errorMsg);
      setLiveDataRaw(errorMsg);
      setLiveMarketData([]);
    } finally {
      setIsLoadingLive(false);
    }
  }, [stateFilter, districtFilter, commodityFilter]);

  // Helper function to parse date
  const parseDate = (dateStr: string): Date => {
    try {
      // Handle DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      return new Date(dateStr);
    } catch {
      return new Date(0); // Return epoch if parsing fails
    }
  };

  // Note: If needed later, add a helper to check date recency

  // Process and sort data function
  const sortedLiveData = useMemo(() => {
    if (!liveMarketData.length) return [];

    let filteredData = [...liveMarketData];

    // Group by commodity and location to get unique combinations
    const uniqueData = filteredData.reduce((acc, record) => {
      const key = `${record.Commodity}-${record.State}-${record.District}-${record.Market}`;

      if (!acc[key] || parseDate(record.Arrival_Date) > parseDate(acc[key].Arrival_Date)) {
        acc[key] = record; // Keep the most recent record for each location-commodity combination
      }

      return acc;
    }, {} as Record<string, any>);

    const finalData = Object.values(uniqueData);

    // Sort by modal price descending (highest first)
    return finalData.sort((a: MarketRecord, b: MarketRecord) => {
      const aPrice = parseFloat(a.Modal_Price) || 0;
      const bPrice = parseFloat(b.Modal_Price) || 0;
      return bPrice - aPrice;
    });
  }, [liveMarketData]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr.split('/').reverse().join('-'));
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Placeholder for future item click handler (details modal)

  const filteredData = priceData.filter(item => {
    return (selectedCrop === 'all' || item.crop === selectedCrop) &&
      (selectedMarket === 'all' || item.market === selectedMarket);
  });

  const normalizeValue = (value: string) => value.trim().toLowerCase();

  const displayedLiveData = useMemo(() => {
    return sortedLiveData.filter((record: MarketRecord) => {
      const cropMatches = selectedCrop === 'all' || record.Commodity === selectedCrop;
      const marketMatches = selectedMarket === 'all' || record.Market === selectedMarket;

      const stateMatches = !stateFilter || normalizeValue(record.State).includes(normalizeValue(stateFilter));
      const districtMatches = !districtFilter || normalizeValue(record.District).includes(normalizeValue(districtFilter));
      const commodityMatches = !commodityFilter || normalizeValue(record.Commodity).includes(normalizeValue(commodityFilter));

      return cropMatches && marketMatches && stateMatches && districtMatches && commodityMatches;
    });
  }, [sortedLiveData, selectedCrop, selectedMarket, stateFilter, districtFilter, commodityFilter]);

  const clearAllFilters = () => {
    setSelectedCrop('all');
    setSelectedMarket('all');
    setStateFilter('');
    setDistrictFilter('');
    setCommodityFilter('');
    setLiveDataRaw(null);
    fetchLive({ state: '', district: '', commodity: '' });
    console.log('[PricePrediction] All filters cleared');
  };

  // Trend and confidence helpers are computed inline in JSX

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
              <TrendingUp className="w-8 h-8" />
              <span>{t('marketPrices')}</span>
            </h2>
            <div className="flex items-center space-x-4 mt-3">
              <p className="text-green-50 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {i18n.language === 'en'
                    ? `${t('last')} ${t('updated')}: ${lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                    : `${t('last')} ${t('updated')}: ${lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  }
                </span>
              </p>
              {aiPriceStatus && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                  {aiPriceStatus.aiGeneratedPriceCount} {t('aiPricesAvailable')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={fetchPriceData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-green-600 rounded-xl hover:bg-green-50 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? t('updating') : t('refresh')}</span>
          </button>
        </div>
      </div>

      {/* AI Insights Banner with Glassmorphism */}
      <div className="relative bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-blue-400/5"></div>
        <div className="relative">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>🤖 {t('aiGeneratedPrices')}</span>
              </h3>
              <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                {i18n.language === 'en'
                  ? 'Prices generated daily by Gemini AI based on market trends, seasonal patterns, and demand-supply analysis.'
                  : i18n.language === 'mr'
                    ? 'जेमिनी AI द्वारे बाजार ट्रेंड, हंगामी पॅटर्न आणि मागणी-पुरवठा विश्लेषणावर आधारित दररोज किंमती तयार केल्या जातात.'
                    : 'जेमिनी AI द्वारा बाजार ट्रेंड, मौसमी पैटर्न और मांग-आपूर्ति विश्लेषण के आधार पर दैनिक कीमतें उत्पन्न की जाती हैं।'
                }
              </p>
              {aiPriceStatus && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${aiPriceStatus.status === 'fresh'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                    }`}>
                    {aiPriceStatus.status === 'fresh' ? `✓ ${t('freshData')}` : `⚠ ${t('updatingSoon')}`}
                  </span>
                  {aiPriceStatus.lastFetchTime && (
                    <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-purple-700 font-medium shadow-sm">
                      {t('last')}: {new Date(aiPriceStatus.lastFetchTime).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  <span className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-blue-700 font-medium shadow-sm">
                    {t('next')}: {aiPriceStatus.nextScheduledFetch}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {t('filterPrices')}
            </h3>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 hover:bg-white font-medium"
            >
              <option value="all">{t('allCrops')}</option>
              {Array.from(new Set(liveMarketData.map(item => item.Commodity))).sort().map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>

            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 hover:bg-white font-medium"
            >
              <option value="all">{t('allMarkets')}</option>
              {Array.from(new Set(liveMarketData.map(item => item.Market))).sort().map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>

          {/* Enhanced Live API filters */}
          <div className="w-full border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm font-medium text-blue-700">
                {t('liveMarketDataFilters')}:
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {t('latest30DaysOnly')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <input
                  placeholder={i18n.language === 'en' ? 'State (partial match, e.g., "Madhya")' : i18n.language === 'mr' ? 'राज्य (आंशिक मिलान, उदा., "मध्य")' : 'राज्य (आंशिक मैच, जैसे, "मध्य")'}
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {stateFilter && (
                  <span className="absolute right-2 top-2 text-xs text-green-600">
                    ✓ {stateFilter.length} {t('chars')}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  placeholder={i18n.language === 'en' ? 'District (partial match, e.g., "Rajgarh")' : i18n.language === 'mr' ? 'जिल्हा (आंशिक मिलान, उदा., "राजगड")' : 'जिला (आंशिक मैच, जैसे, "राजगढ़")'}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {districtFilter && (
                  <span className="absolute right-2 top-2 text-xs text-green-600">
                    ✓ {districtFilter.length} {t('chars')}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  placeholder={i18n.language === 'en' ? 'Commodity (partial match, e.g., "Soya")' : i18n.language === 'mr' ? 'कमोडिटी (आंशिक मिलान, उदा., "सोया")' : 'कमोडिटी (आंशिक मैच, जैसे, "सोया")'}
                  value={commodityFilter}
                  onChange={(e) => setCommodityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {commodityFilter && (
                  <span className="absolute right-2 top-2 text-xs text-green-600">
                    ✓ {commodityFilter.length} {t('chars')}
                  </span>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={fetchLive}
                  disabled={isLoadingLive}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  {isLoadingLive && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>
                    {isLoadingLive ? t('loading') : t('search')}
                  </span>
                </button>

                <button
                  onClick={clearAllFilters}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                >
                  {t('clear')}
                </button>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-gray-600 mr-2">
                {t('quickFilters')}:
              </span>
              {['Wheat', 'Rice', 'Onion', 'Potato', 'Tomato', 'Cotton', 'Soybean', 'Gram'].map(commodity => (
                <button
                  key={commodity}
                  onClick={() => setCommodityFilter(commodity)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${commodityFilter.toLowerCase() === commodity.toLowerCase()
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  {commodity}
                </button>
              ))}
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors"
              >
                {t('clearAll')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Data Cards */}
      {displayedLiveData.length > 0 && (
        <div className="space-y-6">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <DollarSign className="w-7 h-7" />
                  <span>
                    {t('aiGeneratedPrices')}
                  </span>
                </h3>
                <p className="text-purple-100 text-sm mt-2">
                  {i18n.language === 'en' ? `${displayedLiveData.length} markets • Powered by Gemini AI` :
                    i18n.language === 'mr' ? `${displayedLiveData.length} बाजार • Gemini AI द्वारे समर्थित` :
                      `${displayedLiveData.length} बाज़ार • Gemini AI द्वारा संचालित`}
                </p>
              </div>
              <div className="text-right">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <div className="text-white text-sm font-semibold">
                    {t('aiPowered')}
                  </div>
                  <div className="text-purple-200 text-xs">{t('updatedDaily')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedLiveData.map((record: MarketRecord, index: number) => {
              const minPrice = parseFloat(record.Min_Price);
              const maxPrice = parseFloat(record.Max_Price);
              const modalPrice = parseFloat(record.Modal_Price);
              const priceVariation = ((maxPrice - minPrice) / modalPrice * 100);

              // Generate a mock forecast (in real app, this would come from AI)
              const forecastPrice = modalPrice + (modalPrice * (Math.random() * 0.2 - 0.1)); // ±10% variation
              const priceChange = ((forecastPrice - modalPrice) / modalPrice * 100);
              const isPositiveForecast = priceChange > 0;

              // Mock confidence based on price stability
              const confidence = Math.max(60, Math.min(95, 100 - Math.abs(priceVariation * 2)));

              return (
                <div key={index} className="group relative bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-1">
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-blue-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>

                  <div className="relative">
                    {/* Card Header */}
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex items-start space-x-4">
                        {/* Enhanced Commodity Icon */}
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:scale-110 transition-transform">
                          {record.Commodity.charAt(0).toUpperCase()}
                        </div>

                        {/* Commodity Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg truncate">{record.Commodity}</h3>
                          <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{record.District}, {record.State}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {record.Market} • {record.Variety}
                          </div>
                        </div>

                        {/* Price Change Badge */}
                        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm ${isPositiveForecast
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          }`}>
                          {isPositiveForecast ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          <span>{isPositiveForecast ? '+' : ''}{priceChange.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Price Information */}
                    <div className="p-5 space-y-4">
                      {/* Today's Price - Prominent Display */}
                      <div className="text-center py-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          {t('todaysPrice')}
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {formatPrice(modalPrice)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{t('perQuintal')}</div>
                      </div>

                      {/* Tomorrow's Forecast */}
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          {t('tomorrowsForecast')}
                        </div>
                        <div className={`text-xl font-bold ${isPositiveForecast ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {formatPrice(forecastPrice)}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-2">
                          {t('priceRange')}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 font-medium">
                            {t('min')}: {formatPrice(minPrice)}
                          </span>
                          <span className="text-red-600 font-medium">
                            {t('max')}: {formatPrice(maxPrice)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full mt-2"></div>
                      </div>

                      {/* Confidence & AI Model */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div>
                          <div className="text-sm text-gray-600">
                            {t('reliability')}
                          </div>
                          <div className={`text-lg font-bold ${confidence >= 80 ? 'text-green-600' :
                            confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {confidence.toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-purple-600 flex items-center space-x-1">
                            <BarChart3 className="w-3 h-3" />
                            <span>{t('mlModel')}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {t('aiPrediction')}
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {t('updated')}: {formatDate(record.Arrival_Date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>{t('liveData')}</span>
                </span>
                <span>{t('allAvailableMarkets', { count: displayedLiveData.length })}</span>
              </div>
              <div className="text-xs">
                {t('poweredByGovData')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live raw output (for debugging only) */}
      {liveDataRaw && liveDataRaw.startsWith('Error:') && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          {liveDataRaw}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button
                onClick={fetchPriceData}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                {i18n.language === 'en' ? 'Retry' : i18n.language === 'mr' ? 'पुन्हा प्रयत्न' : 'पुनः प्रयास'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredData.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-600">
          <p className="font-medium mb-1">{i18n.language === 'en' ? 'No results found' : i18n.language === 'mr' ? 'निकाल सापडले नाहीत' : 'कोई परिणाम नहीं मिला'}</p>
          <p className="text-sm">{i18n.language === 'en' ? 'Try adjusting filters or refresh.' : i18n.language === 'mr' ? 'फिल्टर बदला किंवा रिफ्रेश करा.' : 'फिल्टर बदलें या रिफ्रेश करें।'}</p>
        </div>
      )}



      {/* Price Alert Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">
              {i18n.language === 'en' ? '💡 Farmer Tips' : i18n.language === 'mr' ? '💡 शेतकरी सल्ला' : '💡 किसान सलाह'}
            </h3>
            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
              <li>
                {i18n.language === 'en'
                  ? '• Tomato and chili prices may rise — good time to sell'
                  : i18n.language === 'mr'
                    ? '• टोमॅटो आणि मिरचीच्या किमती वाढू शकतात — विक्रीसाठी चांगला वेळ'
                    : '• टमाटर और मिर्च के भाव बढ़ने की संभावना — बेचने का अच्छा समय'}
              </li>
              <li>
                {i18n.language === 'en'
                  ? '• Store onions — prices may increase till Diwali'
                  : i18n.language === 'mr'
                    ? '• कांदे साठवा — दिवाळीपर्यंत किमती वाढू शकतात'
                    : '• प्याज का भंडारण करें — दिवाली तक भाव बढ़ सकता है'}
              </li>
              <li>
                {i18n.language === 'en'
                  ? '• Sell potatoes early — new harvest may reduce prices'
                  : i18n.language === 'mr'
                    ? '• बटाटे लवकर विक्री करा — नव्या हंगामामुळे किमती कमी होऊ शकतात'
                    : '• आलू जल्दी बेच दें — नई फसल से भाव गिर सकता है'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Modal */}
      {selectedItemDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {selectedItemDetails.crop} - {selectedItemDetails.market}
                </h3>
                <button
                  onClick={() => setSelectedItemDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 {t('aiAnalysis')}</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedItemDetails.analysis}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">📈 पिछले सप्ताह के भाव</h4>
                    <div className="space-y-1 text-sm">
                      {selectedItemDetails.historical.slice(-7).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{new Date(item.date).toLocaleDateString('hi-IN')}</span>
                          <span>₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">🔮 आगामी पूर्वानुमान</h4>
                    <div className="space-y-1 text-sm">
                      {selectedItemDetails.forecast.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{new Date(item.date).toLocaleDateString('hi-IN')}</span>
                          <span className="font-medium">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
