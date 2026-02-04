import { useEffect, useRef, useState } from 'react';
import { User, Edit, MapPin, Phone, Mail, CreditCard, Settings, LogOut, Volume, VolumeX } from 'lucide-react';
import { Modal } from './Modal';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { socketService } from '../services/socketService';

import { useVoice } from '../hooks/useVoice';

export function Profile() {
  const { isVoiceEnabled, toggleVoice } = useVoice();
  const { t, i18n } = useTranslation();
  const { token, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    landSize: '',
    crops: [] as string[],
    kccNumber: '',
    aadhaar: '',
    bankAccount: ''
  });

  const backendUrl = (import.meta as ImportMeta).env?.VITE_SERVER_URL ?? '';
  const controllerRef = useRef<AbortController | null>(null);

  function setFromResponse(data: any) {
    setProfile({
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      location: data.location || '',
      landSize: data.landSize || '',
      crops: Array.isArray(data.crops) ? data.crops : [],
      kccNumber: data.kccNumber || '',
      aadhaar: data.aadhaar || '',
      bankAccount: data.bankAccount || ''
    });
  }


  const fetchProfile = async () => {
    if (!token || isEditing) return;
    setLoading(true);
    setError(null);
    try {
      controllerRef.current?.abort();
      const ctrl = new AbortController();
      controllerRef.current = ctrl;
      const res = await fetch(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal
      });

      if (res.ok) {
        const data = await res.json();
        setFromResponse(data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to load profile');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchProfile();

    // Poll every 5s when not editing
    const pollId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchProfile();
      }
    }, 5000);

    // Refetch on window focus/visibility
    const onFocus = () => fetchProfile();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchProfile();
    };

    // Connect to Socket.IO
    socketService.connect(token); // Passing token as userId/auth token

    // Subscribe to profile updates
    const handleProfileUpdate = (data: any) => {
      if (data.profile) {
        setFromResponse(data.profile);
        setLastUpdated(new Date());
      }
      if (data.stats) {
        setStats({
          totalCrops: data.stats.totalCrops || stats.totalCrops,
          schemesApplied: data.stats.schemesApplied || stats.schemesApplied,
          monthlyEarnings: data.stats.monthlyEarnings || stats.monthlyEarnings,
          membershipYears: data.stats.membershipYears || stats.membershipYears,
          lastUpdate: new Date()
        });
      }
    };

    socketService.subscribe('profile:update', handleProfileUpdate);

    return () => {
      clearInterval(pollId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      controllerRef.current?.abort();
      socketService.unsubscribe('profile:update');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, token, isEditing]);

  // Stats state
  const [stats, setStats] = useState({
    totalCrops: 0,
    schemesApplied: 0,
    monthlyEarnings: 0,
    membershipYears: 0,
    lastUpdate: new Date()
  });

  // Fetch stats
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${backendUrl}/api/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalCrops: data.totalCrops || 0,
          schemesApplied: data.schemesApplied || 0,
          monthlyEarnings: data.monthlyEarnings || 0,
          membershipYears: data.membershipYears || 0,
          lastUpdate: new Date()
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Add stats fetching to the useEffect
  useEffect(() => {
    if (!token) return;

    fetchStats();
    const statsInterval = setInterval(fetchStats, 30000); // Update every 30 seconds

    return () => clearInterval(statsInterval);
  }, [token, backendUrl]);

  const statsDisplay = [
    {
      label: t('totalCrops'),
      value: stats.totalCrops.toString(),
      color: 'text-green-600',
      loading: loading,
      formatter: (v: string) => v
    },
    {
      label: t('schemesApplied'),
      value: stats.schemesApplied.toString(),
      color: 'text-blue-600',
      loading: loading,
      formatter: (v: string) => v
    },
    {
      label: i18n.language === 'en' ? 'This Month Earnings' : i18n.language === 'mr' ? 'या महिन्याची कमाई' : 'इस महीने कमाई',
      value: stats.monthlyEarnings.toString(),
      color: 'text-purple-600',
      loading: loading,
      formatter: (v: string) => `₹${parseInt(v).toLocaleString('en-IN')}`
    },
    {
      label: i18n.language === 'en' ? 'Membership' : i18n.language === 'mr' ? 'सदस्यत्व' : 'सदस्यता',
      value: stats.membershipYears.toString(),
      color: 'text-orange-600',
      loading: loading,
      formatter: (v: string) => i18n.language === 'en'
        ? `${v} Years`
        : i18n.language === 'mr'
          ? `${v} वर्षे`
          : `${v} साल`
    }
  ];

  const [showSettings, setShowSettings] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [payments, setPayments] = useState<Array<{
    id: string;
    date: string;
    amount: number;
    type: string;
    status: string;
  }>>([]);
  const [supportMessages, setSupportMessages] = useState<Array<{
    id: string;
    date: string;
    message: string;
    response?: string;
    status: 'pending' | 'answered';
  }>>([]);

  // Fetch payment history
  const fetchPayments = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/profile/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  // Submit support message
  const submitSupportMessage = async (message: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/support/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });
      if (res.ok) {
        const data = await res.json();
        setSupportMessages(prev => [...prev, data]);
      }
    } catch (err) {
      console.error('Failed to submit support message:', err);
    }
  };

  const menuItems = [
    {
      icon: Settings,
      label: t('settings'),
      action: () => setShowSettings(true),
      dialog: showSettings,
      setDialog: setShowSettings,
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">
            {i18n.language === 'en' ? 'Settings' : i18n.language === 'mr' ? 'सेटिंग्ज' : 'सेटिंग्स'}
          </h3>
          <div className="space-y-4">
            {/* Notification Settings */}
            <div className="flex items-center justify-between">
              <span>{t('enableNotifications')}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {/* SMS Alerts */}
            <div className="flex items-center justify-between">
              <span>{t('smsAlerts')}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: CreditCard,
      label: t('paymentHistory'),
      action: () => {
        setShowPayments(true);
        fetchPayments();
      },
      dialog: showPayments,
      setDialog: setShowPayments,
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">
            {i18n.language === 'en' ? 'Payment History' : i18n.language === 'mr' ? 'पेमेंट हिस्टरी' : 'भुगतान इतिहास'}
          </h3>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {i18n.language === 'en'
                  ? 'No payment history found'
                  : i18n.language === 'mr'
                    ? 'कोणताही पेमेंट हिस्टरी सापडला नाही'
                    : 'कोई भुगतान इतिहास नहीं मिला'}
              </p>
            ) : (
              <div className="divide-y">
                {payments.map(payment => (
                  <div key={payment.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{payment.type}</p>
                      <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{payment.amount}</p>
                      <p className={`text-sm ${payment.status === 'success' ? 'text-green-500' :
                          payment.status === 'pending' ? 'text-yellow-500' :
                            'text-red-500'
                        }`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      icon: Phone,
      label: t('helpSupport'),
      action: () => setShowSupport(true),
      dialog: showSupport,
      setDialog: setShowSupport,
      content: (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">
            {i18n.language === 'en' ? 'Help & Support' : i18n.language === 'mr' ? 'मदत आणि सपोर्ट' : 'सहायता और समर्थन'}
          </h3>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              <p className="font-medium mb-1">
                {i18n.language === 'en'
                  ? 'Customer Support'
                  : i18n.language === 'mr'
                    ? 'ग्राहक सहाय्य'
                    : 'ग्राहक सहायता'}
              </p>
              <p className="text-sm">
                {i18n.language === 'en'
                  ? 'Call us: 1800-123-4567 (Toll Free)'
                  : i18n.language === 'mr'
                    ? 'आम्हाला कॉल करा: 1800-123-4567 (टोल फ्री)'
                    : 'हमें कॉल करें: 1800-123-4567 (टोल फ्री)'}
              </p>
              <p className="text-sm">
                {i18n.language === 'en'
                  ? 'Email: support@kisansathi.com'
                  : 'ईमेल: support@kisansathi.com'}
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder={i18n.language === 'en'
                  ? 'Type your message here...'
                  : i18n.language === 'mr'
                    ? 'येथे आपला संदेश टाइप करा...'
                    : 'यहां अपना संदेश टाइप करें...'}
              ></textarea>
              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                onClick={() => submitSupportMessage("User's message")}
              >
                {i18n.language === 'en'
                  ? 'Send Message'
                  : i18n.language === 'mr'
                    ? 'संदेश पाठवा'
                    : 'संदेश भेजें'}
              </button>
            </div>

            <div className="space-y-4 mt-6">
              <h4 className="font-medium">
                {i18n.language === 'en'
                  ? 'Previous Messages'
                  : i18n.language === 'mr'
                    ? 'मागील संदेश'
                    : 'पिछले संदेश'}
              </h4>
              {supportMessages.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {i18n.language === 'en'
                    ? 'No messages yet'
                    : i18n.language === 'mr'
                      ? 'अजून कोणतेही संदेश नाहीत'
                      : 'अभी तक कोई संदेश नहीं'}
                </p>
              ) : (
                <div className="divide-y">
                  {supportMessages.map(msg => (
                    <div key={msg.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <p className="font-medium">{msg.message}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(msg.date).toLocaleDateString()}
                        </span>
                      </div>
                      {msg.response && (
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {msg.response}
                        </p>
                      )}
                      <span className={`text-xs ${msg.status === 'answered' ? 'text-green-500' : 'text-yellow-500'
                        }`}>
                        {msg.status === 'answered'
                          ? (i18n.language === 'en' ? 'Answered' : i18n.language === 'mr' ? 'उत्तर दिले' : 'उत्तर दिया गया')
                          : (i18n.language === 'en' ? 'Pending' : i18n.language === 'mr' ? 'प्रलंबित' : 'लंबित')
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      icon: LogOut,
      label: t('logout'),
      action: () => { logout(); },
      danger: true
    }
  ];

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          email: profile.email,
          location: profile.location,
          landSize: profile.landSize,
          crops: profile.crops,
          kccNumber: profile.kccNumber,
          aadhaar: profile.aadhaar,
          bankAccount: profile.bankAccount
        })
      });

      if (res.ok) {
        setIsEditing(false);
        // Immediately refresh from server to reflect any server-side changes
        await fetchProfile();
        // Show success message
        const successMsg = i18n.language === 'en'
          ? 'Profile updated successfully'
          : i18n.language === 'mr'
            ? 'प्रोफाइल यशस्वीरित्या अपडेट केले'
            : 'प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया';
        // You might want to add a toast/notification system here
        console.log(successMsg);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      setIsEditing(true); // Keep editing mode on if there's an error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-green-100">{profile.location}</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/15">
                <span>{t('member')}</span>
                <span className="mx-1">•</span>
                <span className="font-medium">{t('premium')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={toggleVoice} className="p-2 hover:bg-white/20 rounded-lg">
              {isVoiceEnabled ? <Volume size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <Edit size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsDisplay.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border text-center">
            {stat.loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24 mx-auto"></div>
                <div className="h-4 bg-gray-100 rounded w-20 mx-auto mt-2"></div>
              </div>
            ) : (
              <>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.formatter(stat.value)}
                </p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                {index === 2 && ( // Only for earnings
                  <div className="mt-1 text-xs">
                    <span className="text-green-500">↑ 12%</span>
                    <span className="text-gray-400 ml-1">
                      {i18n.language === 'en' ? 'vs last month' : i18n.language === 'mr' ? 'मागील महिन्यापेक्षा' : 'पिछले महीने से'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Profile Details */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{t('personalInfo')}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2 text-green-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {i18n.language === 'en' ? 'Updating...' : i18n.language === 'mr' ? 'अपडेट करत आहे...' : 'अपडेट हो रहा है...'}
                </span>
              ) : (
                <span>
                  {i18n.language === 'en'
                    ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                    : i18n.language === 'mr'
                      ? `शेवटचे अपडेट: ${lastUpdated.toLocaleTimeString()}`
                      : `आखरी अपडेट: ${lastUpdated.toLocaleTimeString()}`
                  }
                </span>
              )}
            </p>
          </div>
          {isEditing && (
            <div className="space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {t('save')}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-800">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('mobileNumber')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-800 flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{profile.phone}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-800 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{profile.email}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
              {isEditing ? (
                <textarea
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              ) : (
                <p className="text-gray-800">{profile.location}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('landSize')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.landSize}
                  onChange={(e) => setProfile({ ...profile, landSize: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-800">{profile.landSize}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('mainCrops')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.crops.join(', ')}
                  onChange={(e) => setProfile({
                    ...profile,
                    crops: e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                  })}
                  placeholder="e.g. Rice, Wheat, Mustard"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.crops.map((crop, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KCC</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.kccNumber}
                  onChange={(e) => setProfile({ ...profile, kccNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono"
                />
              ) : (
                <p className="text-gray-800 font-mono">{profile.kccNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('aadhaarNumber')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.aadhaar}
                  onChange={(e) => setProfile({ ...profile, aadhaar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono"
                />
              ) : (
                <p className="text-gray-800 font-mono">{profile.aadhaar}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('bankAccount')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.bankAccount}
                  onChange={(e) => setProfile({ ...profile, bankAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-800">{profile.bankAccount}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('quickActions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index}>
                <button
                  onClick={item.action}
                  className={`flex items-center space-x-3 p-4 rounded-lg transition-colors text-left w-full ${item.danger
                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>

                {/* Render Modal for Settings, Payment History and Support */}
                {!item.danger && item.dialog !== undefined && (
                  <Modal
                    show={item.dialog}
                    onClose={() => item.setDialog(false)}
                  >
                    {item.content}
                  </Modal>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* i18n.language Preferences */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('languageSettings')}</h3>
        <div className="grid grid-cols-3 gap-2">
          <label className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${i18n.language === 'hi' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
            <input
              type="radio"
              name="i18n.language"
              value="hi"
              checked={i18n.language === 'hi'}
              onChange={(e) => i18n.changeLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="sr-only"
            />
            <span>🇮🇳</span>
            <span>{t('hindi')}</span>
          </label>
          <label className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${i18n.language === 'mr' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
            <input
              type="radio"
              name="i18n.language"
              value="mr"
              checked={i18n.language === 'mr'}
              onChange={(e) => i18n.changeLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="sr-only"
            />
            <span>🇮🇳</span>
            <span>{t('marathi')}</span>
          </label>
          <label className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${i18n.language === 'en' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
            <input
              type="radio"
              name="i18n.language"
              value="en"
              checked={i18n.language === 'en'}
              onChange={(e) => i18n.changeLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="sr-only"
            />
            <span>🇺🇸</span>
            <span>English</span>
          </label>
        </div>
      </div>
    </div>
  );
}
