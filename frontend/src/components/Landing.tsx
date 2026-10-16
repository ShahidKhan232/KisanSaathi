import { useState } from 'react';
import { Sprout, Brain, TrendingUp, Globe, Building2, ChevronRight, Menu, X, Check } from 'lucide-react';
import { AuthForm } from './AuthForm';

export function Landing() {
  const [language, setLanguage] = useState('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    district: '',
    crops: ''
  });

  const content = {
    en: {
      tagline: 'Your Smart Farming Companion – Diagnose, Decide & Prosper',
      hero: 'Detect crop diseases, track market prices, and discover government schemes — all in your language.',
      cta: 'Get Early Access',
      tryDemo: 'Try Demo',
      features: 'Key Features',
      feature1Title: 'AI Crop Disease Detection',
      feature1Desc: 'Upload or snap a photo — get instant diagnosis and treatment suggestions.',
      feature2Title: 'Market Price Insights',
      feature2Desc: 'View real-time mandi prices and best places to sell.',
      feature3Title: 'Multilingual Assistant',
      feature3Desc: 'English, Hindi, Marathi – easy for every farmer.',
      feature4Title: 'Government Schemes',
      feature4Desc: 'Get relevant scheme updates for your crop and region.',
      testimonial: 'Kisanसाथी helped me identify a pest issue early and saved my wheat crop!',
      testimonialAuthor: 'Farmer, Maharashtra',
      ctaTitle: 'Be the First to Try Kisanसाथी',
      formName: 'Name',
      formEmail: 'Email',
      formDistrict: 'District',
      formCrops: 'Crops Grown (Optional)',
      submit: 'Join Beta',
      footer: 'Made for Farmers of India',
      thankYou: "Thank you! We'll be in touch soon.",
      loginOrSignup: 'Login or Sign up'
    },
    hi: {
      tagline: 'आपका स्मार्ट खेती साथी – पहचानें, निर्णय लें और समृद्ध हों',
      hero: 'फसल रोगों का पता लगाएं, बाजार मूल्य ट्रैक करें, और सरकारी योजनाएं खोजें — आपकी भाषा में।',
      cta: 'जल्दी पहुंच पाएं',
      tryDemo: 'डेमो आज़माएं',
      features: 'मुख्य विशेषताएं',
      feature1Title: 'AI फसल रोग पहचान',
      feature1Desc: 'फोटो अपलोड या स्नैप करें — तुरंत निदान और उपचार सुझाव प्राप्त करें।',
      feature2Title: 'बाजार मूल्य जानकारी',
      feature2Desc: 'रियल-टाइम मंडी कीमतें और बेचने के सर्वोत्तम स्थान देखें।',
      feature3Title: 'बहुभाषी सहायक',
      feature3Desc: 'अंग्रेजी, हिंदी, मराठी – हर किसान के लिए आसान।',
      feature4Title: 'सरकारी योजनाएं',
      feature4Desc: 'अपनी फसल और क्षेत्र के लिए प्रासंगिक योजना अपडेट प्राप्त करें।',
      testimonial: 'किसान साथी ने मुझे कीट समस्या की जल्दी पहचान करने में मदद की और मेरी गेहूं की फसल बचाई!',
      testimonialAuthor: 'किसान, महाराष्ट्र',
      ctaTitle: 'किसान साथी आज़माने वाले पहले बनें',
      formName: 'नाम',
      formEmail: 'ईमेल',
      formDistrict: 'जिला',
      formCrops: 'उगाई गई फसलें (वैकल्पिक)',
      submit: 'बीटा में शामिल हों',
      footer: 'भारत के किसानों के लिए बनाया गया',
      thankYou: 'धन्यवाद! हम जल्द ही संपर्क करेंगे।',
      loginOrSignup: 'लॉगिन या साइन अप करें'
    },
    mr: {
      tagline: 'तुमचा स्मार्ट शेती साथी – निदान करा, निर्णय घ्या आणि समृद्ध व्हा',
      hero: 'पीक रोग शोधा, बाजार किंमती ट्रॅक करा आणि सरकारी योजना शोधा — तुमच्या भाषेत.',
      cta: 'लवकर प्रवेश मिळवा',
      tryDemo: 'डेमो वापरून पहा',
      features: 'मुख्य वैशिष्ट्ये',
      feature1Title: 'AI पीक रोग ओळख',
      feature1Desc: 'फोटो अपलोड किंवा स्नॅप करा — त्वरित निदान आणि उपचार सूचना मिळवा.',
      feature2Title: 'बाजार किंमत माहिती',
      feature2Desc: 'रिअल-टाइम मंडी किंमती आणि विकण्यासाठी सर्वोत्तम ठिकाणे पहा.',
      feature3Title: 'बहुभाषिक सहाय्यक',
      feature3Desc: 'इंग्रजी, हिंदी, मराठी – प्रत्येक शेतकऱ्यासाठी सोपे.',
      feature4Title: 'सरकारी योजना',
      feature4Desc: 'तुमच्या पिकासाठी आणि प्रदेशासाठी संबंधित योजना अपडेट मिळवा.',
      testimonial: 'किसान साथीने मला कीटक समस्या लवकर ओळखण्यात मदत केली आणि माझे गहू पीक वाचवले!',
      testimonialAuthor: 'शेतकरी, महाराष्ट्र',
      ctaTitle: 'किसान साथी वापरणारे पहिले व्हा',
      formName: 'नाव',
      formEmail: 'ईमेल',
      formDistrict: 'जिल्हा',
      formCrops: 'पिके (पर्यायी)',
      submit: 'बीटामध्ये सामील व्हा',
      footer: 'भारताच्या शेतकऱ्यांसाठी बनवले',
      thankYou: 'धन्यवाद! आम्ही लवकरच संपर्क करू.',
      loginOrSignup: 'लॉगिन किंवा साइन अप करा'
    }
  } as const;

  const t = content[language as keyof typeof content];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', district: '', crops: '' });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-green-50 to-emerald-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Sprout className="w-8 h-8 text-green-600" />
                <span className="text-xl font-bold text-green-800">Kisanसाथी</span>
              </div>

              {/* Desktop Language Switcher */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex bg-green-100 rounded-lg p-1">
                  {(['en', 'hi', 'mr'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${language === lang
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-green-700 hover:bg-green-200'
                        }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAuthOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                  {t.cta}
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-green-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-green-800" /> : <Menu className="w-6 h-6 text-green-800" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 space-y-4">
                <div className="flex flex-col space-y-2">
                  {(['en', 'hi', 'mr'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${language === lang
                        ? 'bg-green-600 text-white'
                        : 'text-green-700 hover:bg-green-100'
                        }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAuthOpen(true)} className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all">
                  {t.cta}
                </button>
              </div>
            )}
          </nav>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-900 leading-tight">
                {t.tagline}
              </h1>
              <p className="text-lg md:text-xl text-green-700 leading-relaxed">
                {t.hero}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setAuthOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center group">
                  {t.cta}
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border-2 border-green-600 text-green-700 hover:bg-green-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all">
                  {t.tryDemo}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-10 h-10 text-green-600" />
                    <div className="flex-1 h-4 bg-green-100 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-green-50 rounded w-3/4"></div>
                    <div className="h-3 bg-green-50 rounded w-full"></div>
                    <div className="h-3 bg-green-50 rounded w-2/3"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="h-2 bg-green-200 rounded w-3/4 mx-auto"></div>
                    </div>
                    <div className="bg-amber-100 rounded-lg p-3 text-center">
                      <Building2 className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <div className="h-2 bg-amber-200 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-green-900 text-center mb-12">
              {t.features}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="bg-green-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">{t.feature1Title}</h3>
                <p className="text-green-700 leading-relaxed">{t.feature1Desc}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="bg-amber-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">{t.feature2Title}</h3>
                <p className="text-green-700 leading-relaxed">{t.feature2Desc}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">{t.feature3Title}</h3>
                <p className="text-green-700 leading-relaxed">{t.feature3Desc}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="bg-orange-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3">{t.feature4Title}</h3>
                <p className="text-green-700 leading-relaxed">{t.feature4Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-5xl mb-6">🌾</div>
              <blockquote className="text-xl md:text-2xl text-white font-medium mb-6 italic">
                "{t.testimonial}"
              </blockquote>
              <p className="text-green-100 text-lg">— {t.testimonialAuthor}</p>
            </div>
          </div>
        </section>

        {/* CTA Form Section */}
        <section className="bg-gradient-to-br from-green-900 to-emerald-900 py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
              {t.ctaTitle}
            </h2>

            {formSubmitted ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">{t.thankYou}</h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl space-y-6">
                <div>
                  <label className="block text-green-900 font-medium mb-2">{t.formName}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-green-900 font-medium mb-2">{t.formEmail}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-green-900 font-medium mb-2">{t.formDistrict}</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-green-900 font-medium mb-2">{t.formCrops}</label>
                  <input
                    type="text"
                    name="crops"
                    value={formData.crops}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:border-green-600 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  {t.submit}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-green-950 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Sprout className="w-6 h-6 text-green-400" />
                <span className="text-lg font-bold">Kisanसाथी</span>
              </div>

              <div className="text-center">
                <p className="text-green-300">support@kisansathi.in</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-green-800 text-center text-green-300">
              <p>© 2025 Kisanसाथी | {t.footer} 🌾</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setAuthOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.loginOrSignup || 'Login or Sign up'}</h3>
            <AuthForm onSuccess={() => setAuthOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}


