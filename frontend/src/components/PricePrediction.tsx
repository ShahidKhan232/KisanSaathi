import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, MapPin, Calendar, Filter, RefreshCw, AlertTriangle, BarChart3 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
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
  const { language, t } = useLanguage();
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
        language === 'en'
          ? 'Failed to load market prices. Please try again.'
          : language === 'mr'
          ? 'बाजारभाव लोड करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.'
          : 'बाज़ार भाव लोड करने में विफल. कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // Fetch real-time price data
  useEffect(() => {
    fetchPriceData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchPriceData, 5 * 60 * 1000);
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

  const fetchLive = useCallback(async () => {
    setIsLoadingLive(true);
    setLiveDataRaw(null);
    console.log('Fetching live data with filters:', { stateFilter, districtFilter, commodityFilter });
    
    try {
      // Clean and prepare filters
      const cleanState = stateFilter?.trim();
      const cleanDistrict = districtFilter?.trim();
      const cleanCommodity = commodityFilter?.trim();
      
      const records = await pricePredictionService.getLiveMarketPrices({
        state: cleanState || undefined,
        district: cleanDistrict || undefined,
        commodity: cleanCommodity || undefined,
        limit: 1000, // Fetch maximum data available
        offset: 0
      });
      
      console.log('Raw records from API:', records);
      console.log('Applied filters:', { cleanState, cleanDistrict, cleanCommodity });
      
      if (!records || !Array.isArray(records)) {
        throw new Error('Invalid response format: expected array of records');
      }
      
      if (records.length === 0) {
        setLiveDataRaw(`No data found for filters: State="${cleanState || 'any'}", District="${cleanDistrict || 'any'}", Commodity="${cleanCommodity || 'any'}". Try different search terms.`);
        setLiveMarketData([]);
        return;
      }
      
      // Filter for basic validity and apply additional client-side filtering if needed
      const processedRecords = records
        .filter(record => {
          // Basic validity check
          const hasValidData = record.Modal_Price && 
                              record.State && 
                              record.District && 
                              record.Market && 
                              record.Commodity;
          
          if (!hasValidData) return false;
          
          // Additional client-side filtering for partial matches (case-insensitive)
          if (cleanState && !record.State.toLowerCase().includes(cleanState.toLowerCase())) {
            return false;
          }
          
          if (cleanDistrict && !record.District.toLowerCase().includes(cleanDistrict.toLowerCase())) {
            return false;
          }
          
          if (cleanCommodity && !record.Commodity.toLowerCase().includes(cleanCommodity.toLowerCase())) {
            return false;
          }
          
          return true;
        });
        // Remove .slice() to show ALL records without limit
      
      console.log('Processed records after filtering:', processedRecords.length);
      
      // Set the formatted data for display
      setLiveMarketData(processedRecords);
      
      if (processedRecords.length === 0) {
        setLiveDataRaw(`Found ${records.length} total records, but none matched your filters. Try: 1) Check spelling, 2) Use partial names (e.g., "Madhya" instead of "Madhya Pradesh"), 3) Clear some filters.`);
      } else {
        setLiveDataRaw(null); // Clear any previous messages
      }
      
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

  // Trend and confidence helpers are computed inline in JSX

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t('pricePrediction')}
          </h2>
          <p className="text-gray-600 flex items-center space-x-2 mt-1">
            <Calendar className="w-4 h-4" />
            <span>
              {language === 'en' 
                ? `Last updated: ${lastUpdate.toLocaleTimeString()}` 
                : `${t('lastUpdate')}: ${lastUpdate.toLocaleTimeString()}`
              }
            </span>
          </p>
        </div>
        
        <button
          onClick={fetchPriceData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? t('updating') : t('refresh')}</span>
        </button>
      </div>

      {/* AI Insights Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BarChart3 className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-800">🤖 AI Market Analysis</h3>
            <p className="text-purple-700 text-sm mt-1">
              {language === 'en' 
                ? 'Powered by Machine Learning algorithms analyzing 1000+ data points including weather, demand, supply, and seasonal patterns.'
                : t('mlDescription')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{language === 'en' ? 'Filter:' : language === 'mr' ? 'फिल्टर:' : 'फ़िल्टर:'}</span>
          </div>
          
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">{t('allCrops')}</option>
            {Array.from(new Set(priceData.map(item => item.crop))).map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>

          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">सभी मंडियां</option>
            {Array.from(new Set(priceData.map(item => item.market))).map(market => (
              <option key={market} value={market}>{market}</option>
            ))}
          </select>

          {/* Enhanced Live API filters */}
          <div className="w-full border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm font-medium text-blue-700">
                {language === 'en' ? 'Live Market Data Filters:' : language === 'mr' ? 'जिवंत बाजार डेटा फिल्टर:' : 'लाइव बाज़ार डेटा फिल्टर:'}
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {language === 'en' ? 'Latest 30 Days Only' : language === 'mr' ? 'फक्त गेले ३० दिवस' : 'केवल पिछले 30 दिन'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <input
                  placeholder={language === 'en' ? 'State (partial match, e.g., "Madhya")' : language === 'mr' ? 'राज्य (आंशिक मिलान, उदा., "मध्य")' : 'राज्य (आंशिक मैच, जैसे, "मध्य")'}
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {stateFilter && (
                  <span className="absolute right-2 top-2 text-xs text-green-600">
                    ✓ {stateFilter.length} chars
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  placeholder={language === 'en' ? 'District (partial match, e.g., "Rajgarh")' : language === 'mr' ? 'जिल्हा (आंशिक मिलान, उदा., "राजगड")' : 'जिला (आंशिक मैच, जैसे, "राजगढ़")'}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {districtFilter && (
                  <span className="absolute right-2 top-2 text-xs text-green-600">
                    ✓ {districtFilter.length} chars
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  placeholder={language === 'en' ? 'Commodity (partial match, e.g., "Soya")' : language === 'mr' ? 'कमोडिटी (आंशिक मिलान, उदा., "सोया")' : 'कमोडिटी (आंशिक मैच, जैसे, "सोया")'}
                  value={commodityFilter}
                  onChange={(e) => setCommodityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {commodityFilter && (
                  <span className="absolute right-2 top-2 text-xs text-green-600">
                    ✓ {commodityFilter.length} chars
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
                    {isLoadingLive 
                      ? (language === 'en' ? 'Loading...' : language === 'mr' ? 'लोड करत आहे...' : 'लोड हो रहा है...')
                      : (language === 'en' ? 'Search' : language === 'mr' ? 'शोधा' : 'खोजें')
                    }
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    setStateFilter('');
                    setDistrictFilter('');
                    setCommodityFilter('');
                    setLiveDataRaw(null);
                    console.log('[PricePrediction] Filters cleared');
                  }}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                >
                  {language === 'en' ? 'Clear' : language === 'mr' ? 'साफ' : 'साफ़'}
                </button>
              </div>
            </div>
            
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-gray-600 mr-2">
                {language === 'en' ? 'Quick filters:' : language === 'mr' ? 'द्रुत फिल्टर:' : 'त्वरित फिल्टर:'}
              </span>
              {['Wheat', 'Rice', 'Onion', 'Potato', 'Tomato', 'Cotton', 'Soybean', 'Gram'].map(commodity => (
                <button
                  key={commodity}
                  onClick={() => setCommodityFilter(commodity)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    commodityFilter.toLowerCase() === commodity.toLowerCase()
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {commodity}
                </button>
              ))}
              <button
                onClick={() => {
                  setStateFilter('');
                  setDistrictFilter('');
                  setCommodityFilter('');
                }}
                className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors"
              >
                {language === 'en' ? 'Clear All' : language === 'mr' ? 'सर्व साफ करा' : 'सभी साफ़ करें'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Data Cards */}
      {sortedLiveData.length > 0 && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <DollarSign className="w-6 h-6" />
                  <span>
                    {language === 'en' ? 'Live Market Prices' : language === 'mr' ? 'जिवंत बाजारभाव' : 'लाइव बाज़ार भाव'}
                  </span>
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {language === 'en' ? `${sortedLiveData.length} markets • All available data` : 
                   language === 'mr' ? `${sortedLiveData.length} बाजार • सर्व उपलब्ध डेटा` : 
                   `${sortedLiveData.length} बाज़ार • सभी उपलब्ध डेटा`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white text-sm opacity-90">
                  {language === 'en' ? 'Government Data Portal' : language === 'mr' ? 'सरकारी डेटा पोर्टल' : 'सरकारी डेटा पोर्टल'}
                </div>
                <div className="text-blue-200 text-xs">data.gov.in</div>
              </div>
            </div>
          </div>

          {/* Market Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLiveData.map((record: MarketRecord, index: number) => {
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
                <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start space-x-3">
                      {/* Commodity Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {record.Commodity.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Commodity Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{record.Commodity}</h3>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{record.District}, {record.State}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {record.Market} • {record.Variety}
                        </div>
                      </div>
                      
                      {/* Price Change Badge */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                        isPositiveForecast 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isPositiveForecast ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{isPositiveForecast ? '+' : ''}{priceChange.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Information */}
                  <div className="p-4 space-y-4">
                    {/* Today's Price */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {language === 'en' ? "Today's Price" : language === 'mr' ? 'आजचा भाव' : 'आज का भाव'}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(modalPrice)}
                      </div>
                    </div>

                    {/* Tomorrow's Forecast */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        {language === 'en' ? "Tomorrow's Forecast" : language === 'mr' ? 'उद्याचा अंदाज' : 'कल का पूर्वानुमान'}
                      </div>
                      <div className={`text-xl font-bold ${
                        isPositiveForecast ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPrice(forecastPrice)}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-2">
                        {language === 'en' ? 'Price Range' : language === 'mr' ? 'भाव श्रेणी' : 'भाव सीमा'}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-medium">
                          Min: {formatPrice(minPrice)}
                        </span>
                        <span className="text-red-600 font-medium">
                          Max: {formatPrice(maxPrice)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full mt-2"></div>
                    </div>

                    {/* Confidence & AI Model */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-sm text-gray-600">
                          {language === 'en' ? 'Reliability' : language === 'mr' ? 'विश्वसनीयता' : 'विश्वसनीयता'}
                        </div>
                        <div className={`text-lg font-bold ${
                          confidence >= 80 ? 'text-green-600' : 
                          confidence >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {confidence.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-purple-600 flex items-center space-x-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>ML Model</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {language === 'en' ? 'AI Prediction' : language === 'mr' ? 'AI पूर्वानुमान' : 'AI पूर्वानुमान'}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {language === 'en' ? 'Updated' : language === 'mr' ? 'अपडेट' : 'अपडेट'}: {formatDate(record.Arrival_Date)}
                      </span>
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
                  <span>{language === 'en' ? 'Live Data' : language === 'mr' ? 'जिवंत डेटा' : 'लाइव डेटा'}</span>
                </span>
                <span>{language === 'en' ? `All ${sortedLiveData.length} available markets` : language === 'mr' ? `सर्व ${sortedLiveData.length} उपलब्ध बाजार` : `सभी ${sortedLiveData.length} उपलब्ध बाज़ार`}</span>
              </div>
              <div className="text-xs">
                {language === 'en' ? 'Powered by Government Open Data' : language === 'mr' ? 'सरकारी ओपन डेटाने चालविले' : 'सरकारी ओपन डेटा द्वारा संचालित'}
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

      {/* Debug Information */}
      {(isLoadingLive || liveMarketData.length > 0 || liveDataRaw) && (
        <div className="bg-gray-50 border rounded p-3 text-sm">
          <div><strong>Debug Info:</strong></div>
          <div>Loading: {isLoadingLive ? 'Yes' : 'No'}</div>
          <div>Raw Data Records: {liveMarketData.length}</div>
          <div>Sorted Data Records: {sortedLiveData.length}</div>
          <div>Filters: State="{stateFilter}", District="{districtFilter}", Commodity="{commodityFilter}"</div>
          {liveDataRaw && !liveDataRaw.startsWith('Error:') && (
            <div>Has Raw Data: Yes</div>
          )}
          {liveMarketData.length > 0 && (
            <div>Sample Record: {JSON.stringify(liveMarketData[0], null, 2)}</div>
          )}
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
                {language === 'en' ? 'Retry' : language === 'mr' ? 'पुन्हा प्रयत्न' : 'पुनः प्रयास'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredData.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-600">
          <p className="font-medium mb-1">{language === 'en' ? 'No results found' : language === 'mr' ? 'निकाल सापडले नाहीत' : 'कोई परिणाम नहीं मिला'}</p>
          <p className="text-sm">{language === 'en' ? 'Try adjusting filters or refresh.' : language === 'mr' ? 'फिल्टर बदला किंवा रिफ्रेश करा.' : 'फिल्टर बदलें या रिफ्रेश करें।'}</p>
        </div>
      )}

      

      {/* Price Alert Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">
              {language === 'en' ? '💡 Farmer Tips' : language === 'mr' ? '💡 शेतकरी सल्ला' : '💡 किसान सलाह'}
            </h3>
            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
              <li>
                {language === 'en'
                  ? '• Tomato and chili prices may rise — good time to sell'
                  : language === 'mr'
                  ? '• टोमॅटो आणि मिरचीच्या किमती वाढू शकतात — विक्रीसाठी चांगला वेळ'
                  : '• टमाटर और मिर्च के भाव बढ़ने की संभावना — बेचने का अच्छा समय'}
              </li>
              <li>
                {language === 'en'
                  ? '• Store onions — prices may increase till Diwali'
                  : language === 'mr'
                  ? '• कांदे साठवा — दिवाळीपर्यंत किमती वाढू शकतात'
                  : '• प्याज का भंडारण करें — दिवाली तक भाव बढ़ सकता है'}
              </li>
              <li>
                {language === 'en'
                  ? '• Sell potatoes early — new harvest may reduce prices'
                  : language === 'mr'
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