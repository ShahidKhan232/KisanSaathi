import { Cloud, Droplets, Thermometer, Wind, TrendingUp, AlertTriangle, RefreshCw, MapPin, Eye, Gauge, Clock, Activity, Users, Sprout } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useWeather } from '../hooks/useWeather';
import { useAlerts } from '../hooks/useAlerts';
import { useApiProfile } from '../hooks/useApiProfile';

export function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useApiProfile();
  const { weather, forecast, loading, error, lastUpdated, refreshWeather } = useWeather(10); // Auto-refresh every 10 minutes
  const { alerts: realTimeAlerts, loading: alertsLoading, refreshAlerts, lastUpdated: alertsLastUpdated } = useAlerts(5); // Auto-refresh every 5 minutes

  // Fallback weather data for when loading or error
  const fallbackWeatherData = {
    temperature: 28,
    humidity: 65,
    rainfall: 12,
    windSpeed: 8,
    description: 'Loading...',
    location: 'Loading...',
    pressure: 1013,
    visibility: 10
  };

  const weatherData = weather || fallbackWeatherData;

  // Generate crops from profile data with fallback
  const getProfileCrops = () => {
    if (profile?.crops && profile.crops.length > 0) {
      return profile.crops.map((crop, index) => ({
        name: crop,
        status: index % 3 === 0 ? 'healthy' : index % 3 === 1 ? 'attention' : 'excellent',
        days: Math.floor(Math.random() * 90) + 30, // Random days between 30-120
        image: `https://images.pexels.com/photos/${index % 2 === 0 ? '326082' : '547263'}/pexels-photo-${index % 2 === 0 ? '326082' : '547263'}.jpeg?auto=compress&cs=tinysrgb&w=100`
      }));
    }
    // Fallback crops if no profile data
    return [
      { name: t('rice'), status: 'healthy', days: 45, image: 'https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=100' },
      { name: t('wheat'), status: 'attention', days: 120, image: 'https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=100' },
      { name: t('corn'), status: 'healthy', days: 30, image: 'https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=100' }
    ];
  };

  const crops = getProfileCrops();

  // Get user display name from profile or auth
  const getUserDisplayName = () => {
    if (profile?.name) return profile.name;
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Farmer';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{`Welcome, ${getUserDisplayName()}!`}</h2>
            <p className="text-green-100">{t('farmStatus')}</p>
            {profile?.location && (
              <div className="flex items-center space-x-1 text-green-100 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}
          </div>
          {profile?.landSize && (
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="flex items-center space-x-2 justify-center">
                <Sprout className="w-5 h-5" />
                <span className="text-sm font-medium">{t('landSize') || 'Land Size'}</span>
              </div>
              <p className="text-lg font-bold mt-1">{profile.landSize}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">{t('todayEarning')}</span>
            </div>
            <p className="text-xl font-bold mt-1">₹2,450</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Sprout className="w-5 h-5" />
              <span className="text-sm font-medium">{t('totalCrops') || 'Total Crops'}</span>
            </div>
            <p className="text-xl font-bold mt-1">{crops.length}</p>
          </div>
        </div>
      </div>

      {/* Weather Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            <span>{t('weather')}</span>
          </h3>
          <div className="flex items-center space-x-3">
            {(weather?.location || profile?.location) && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{weather?.location || profile?.location}</span>
                {!weather?.location && profile?.location && (
                  <span className="text-xs text-gray-400">(from profile)</span>
                )}
              </div>
            )}
            <button
              onClick={refreshWeather}
              disabled={loading}
              className={`p-2 rounded-lg border transition-colors ${loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'
                }`}
              title="Refresh weather data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Weather Status */}
        {weather?.description && (
          <div className="mb-4 flex items-center space-x-2">
            <div className="text-sm text-gray-600 capitalize">{weather.description}</div>
            {loading && <div className="text-xs text-blue-600">Updating...</div>}
            {error && <div className="text-xs text-red-600">Update failed</div>}
          </div>
        )}

        {/* Main Weather Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Thermometer className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{t('temperature')}</p>
            <p className="text-xl font-bold text-blue-600">{weatherData.temperature}°C</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Droplets className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{t('humidity')}</p>
            <p className="text-xl font-bold text-green-600">{weatherData.humidity}%</p>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <Cloud className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{t('rainfall')}</p>
            <p className="text-xl font-bold text-indigo-600">{weatherData.rainfall}mm</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <Wind className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{t('windSpeed')}</p>
            <p className="text-xl font-bold text-purple-600">{weatherData.windSpeed}km/h</p>
          </div>
        </div>

        {/* Additional Weather Info */}
        {weather && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Gauge className="w-4 h-4" />
              <span>Pressure: {weather.pressure} hPa</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" />
              <span>Visibility: {weather.visibility} km</span>
            </div>
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* 5-Day Forecast */}
        {forecast.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">5-Day Forecast</h4>
            <div className="grid grid-cols-5 gap-2">
              {forecast.map((day, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    {day.maxTemp}°/{day.minTemp}°
                  </div>
                  <div className="text-xs text-gray-600 capitalize mt-1">
                    {day.description.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('profileSummary') || 'Profile Summary'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profile.phone && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('phoneNumber') || 'Phone'}</p>
                  <p className="text-gray-600">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.kccNumber && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('kccNumber') || 'KCC Number'}</p>
                  <p className="text-gray-600">{profile.kccNumber}</p>
                </div>
              </div>
            )}
            {profile.bankAccount && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{t('bankAccount') || 'Bank Account'}</p>
                  <p className="text-gray-600">{profile.bankAccount}</p>
                </div>
              </div>
            )}
          </div>
          {(!profile.phone && !profile.kccNumber && !profile.bankAccount) && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">{t('completeProfile') || 'Complete your profile to see more information'}</p>
            </div>
          )}
        </div>
      )}

      {/* My Crops */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('myCrops')}</h3>
          {profile?.crops && profile.crops.length > 0 ? (
            <div className="text-sm text-green-600 font-medium">
              {profile.crops.length} {t('cropsRegistered') || 'crops registered'}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {profileLoading ? 'Loading...' : 'No crops registered'}
            </div>
          )}
        </div>

        {crops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {crops.map((crop, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <img src={crop.image} alt={crop.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <h4 className="font-medium text-gray-800">{crop.name}</h4>
                    <p className="text-sm text-gray-600">{crop.days} {t('days')}</p>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${crop.status === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : crop.status === 'excellent'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {crop.status === 'healthy' ? `✓ ${t('healthy')}` :
                    crop.status === 'excellent' ? `★ ${t('excellent') || 'Excellent'}` :
                      `⚠ ${t('attention')}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Sprout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium mb-2">{t('noCropsYet') || 'No crops registered yet'}</p>
            <p className="text-sm">{t('addCropsInProfile') || 'Add crops in your profile to see them here'}</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('todayAlerts')}</h3>
          <div className="flex items-center space-x-3">
            {alertsLastUpdated && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{new Date(alertsLastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
            <button
              onClick={refreshAlerts}
              disabled={alertsLoading}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50"
              title={t('alertsRefresh')}
            >
              <RefreshCw className={`w-4 h-4 ${alertsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {alertsLoading && realTimeAlerts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Activity className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">{t('loadingAlerts')}</p>
            </div>
          ) : realTimeAlerts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">{t('noAlerts')}</p>
            </div>
          ) : (
            realTimeAlerts.map((alert) => {
              const getPriorityColors = (priority: string) => {
                switch (priority) {
                  case 'critical':
                    return 'bg-red-100 border-red-500 text-red-800';
                  case 'high':
                    return 'bg-red-50 border-red-400 text-red-700';
                  case 'medium':
                    return 'bg-yellow-50 border-yellow-400 text-yellow-700';
                  default:
                    return 'bg-blue-50 border-blue-400 text-blue-700';
                }
              };

              const getIcon = (type: string) => {
                switch (type) {
                  case 'weather':
                    return <Cloud className="w-5 h-5" />;
                  case 'price':
                    return <TrendingUp className="w-5 h-5" />;
                  case 'disease':
                    return <AlertTriangle className="w-5 h-5" />;
                  case 'irrigation':
                    return <Droplets className="w-5 h-5" />;
                  default:
                    return <AlertTriangle className="w-5 h-5" />;
                }
              };

              return (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getPriorityColors(alert.priority)}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${alert.priority === 'critical' ? 'text-red-600' :
                      alert.priority === 'high' ? 'text-red-600' :
                        alert.priority === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                      }`}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {alert.actionRequired && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              {t('actionRequired')}
                            </span>
                          )}
                          <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      {alert.location && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{alert.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}