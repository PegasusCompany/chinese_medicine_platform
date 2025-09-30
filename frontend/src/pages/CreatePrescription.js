import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HerbDualInput from '../components/HerbDualInput';

const CreatePrescription = () => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_phone: '',
    patient_address: '',
    patient_dob: '',
    symptoms: '',
    diagnosis: '',
    treatment_days: 7,
    doses_per_day: 2,
    notes: ''
  });
  
  const [items, setItems] = useState([
    { herb_id: null, herb_name: '', chinese_name: '', quantity_per_day: '', notes: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [formulaAnalysis, setFormulaAnalysis] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const navigate = useNavigate();

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleHerbSelect = (index, herbData) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      herb_id: herbData.herb_id,
      herb_name: herbData.herb_name,
      chinese_name: herbData.chinese_name
    };
    setItems(newItems);
  };

  const handleEnglishNameChange = (index, value) => {
    const newItems = [...items];
    newItems[index].herb_name = value;
    setItems(newItems);
  };

  const handleChineseNameChange = (index, value) => {
    const newItems = [...items];
    newItems[index].chinese_name = value;
    setItems(newItems);
  };

  // Helper functions for bilingual herb name formatting
  const formatHerbName = (englishName, chineseName) => {
    // Handle null, undefined, or empty values
    const hasEnglish = englishName && englishName.trim() !== '';
    const hasChinese = chineseName && chineseName.trim() !== '';
    
    if (hasEnglish && hasChinese) {
      return `${englishName.trim()} (${chineseName.trim()})`;
    } else if (hasEnglish) {
      return englishName.trim();
    } else if (hasChinese) {
      return chineseName.trim();
    } else {
      return 'Unknown Herb';
    }
  };

  const findHerbChineseName = (englishName, items) => {
    if (!englishName || !items) return '';
    
    const herb = items.find(item => 
      item.herb_name && 
      item.herb_name.toLowerCase().trim() === englishName.toLowerCase().trim()
    );
    
    return herb && herb.chinese_name ? herb.chinese_name.trim() : '';
  };

  // AI Prescription Assistant Logic
  const tcmPatterns = {
    'kidney yang deficiency': {
      symptoms: ['fatigue', 'cold limbs', 'lower back pain', 'frequent urination', 'impotence'],
      baseFormula: 'Jin Gui Shen Qi Wan',
      baseFormulaChinese: '金匮肾气丸',
      herbs: [
        { name: 'Aconite', chinese: '附子', quantity: 6, role: 'Emperor - Warm Kidney Yang', roleChinese: '君药 - 温肾阳' },
        { name: 'Cinnamon', chinese: '肉桂', quantity: 3, role: 'Minister - Assist Yang warming', roleChinese: '臣药 - 助阳温煦' },
        { name: 'Rehmannia', chinese: '熟地黄', quantity: 12, role: 'Minister - Nourish Kidney Yin', roleChinese: '臣药 - 滋肾阴' },
        { name: 'Cornus', chinese: '山茱萸', quantity: 6, role: 'Assistant - Tonify Kidney', roleChinese: '佐药 - 补肾' }
      ]
    },
    'spleen qi deficiency': {
      symptoms: ['fatigue', 'poor appetite', 'loose stools', 'bloating', 'pale complexion'],
      baseFormula: 'Si Jun Zi Tang',
      baseFormulaChinese: '四君子汤',
      herbs: [
        { name: 'Ginseng', chinese: '人参', quantity: 9, role: 'Emperor - Tonify Spleen Qi', roleChinese: '君药 - 补脾气' },
        { name: 'Atractylodes', chinese: '白术', quantity: 9, role: 'Minister - Strengthen Spleen', roleChinese: '臣药 - 健脾' },
        { name: 'Poria', chinese: '茯苓', quantity: 9, role: 'Assistant - Drain dampness', roleChinese: '佐药 - 利湿' },
        { name: 'Licorice', chinese: '甘草', quantity: 3, role: 'Envoy - Harmonize formula', roleChinese: '使药 - 调和诸药' }
      ]
    },
    'heart blood deficiency': {
      symptoms: ['insomnia', 'palpitations', 'anxiety', 'poor memory', 'pale complexion'],
      baseFormula: 'Gan Mai Da Zao Tang',
      baseFormulaChinese: '甘麦大枣汤',
      herbs: [
        { name: 'Angelica', chinese: '当归', quantity: 10, role: 'Emperor - Nourish Blood', roleChinese: '君药 - 养血' },
        { name: 'Rehmannia', chinese: '熟地黄', quantity: 12, role: 'Minister - Tonify Blood', roleChinese: '臣药 - 补血' },
        { name: 'Sour Jujube Seed', chinese: '酸枣仁', quantity: 10, role: 'Minister - Calm spirit', roleChinese: '臣药 - 安神' },
        { name: 'Licorice', chinese: '甘草', quantity: 6, role: 'Envoy - Harmonize', roleChinese: '使药 - 调和' }
      ]
    }
  };

  // Pattern display names for Common patterns buttons
  const commonPatterns = [
    { english: "Kidney Yang Deficiency", chinese: "肾阳虚" },
    { english: "Spleen Qi Deficiency", chinese: "脾气虚" },
    { english: "Heart Blood Deficiency", chinese: "心血虚" },
    { english: "Liver Qi Stagnation", chinese: "肝气郁结" }
  ];

  const herbSynergies = {
    'Ginseng': ['Astragalus', 'Atractylodes', 'Licorice'],
    'Astragalus': ['Ginseng', 'Angelica', 'Atractylodes'],
    'Angelica': ['Rehmannia', 'Ligusticum', 'Peony'],
    'Rehmannia': ['Angelica', 'Cornus', 'Dioscorea']
  };

  const herbContraindications = {
    'Aconite': ['Pregnancy', 'Hypertension', 'Heart conditions'],
    'Ephedra': ['Hypertension', 'Heart disease', 'Pregnancy'],
    'Rhubarb': ['Pregnancy', 'Weak constitution', 'Chronic diarrhea']
  };

  const processAiQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Pattern recognition
    for (const [pattern, data] of Object.entries(tcmPatterns)) {
      if (lowerQuery.includes(pattern) || 
          data.symptoms.some(symptom => lowerQuery.includes(symptom))) {
        return {
          type: 'pattern_suggestion',
          pattern: pattern,
          data: data,
          confidence: 0.8
        };
      }
    }

    // Herb combination suggestions
    const currentHerbs = items.filter(item => item.herb_name).map(item => item.herb_name);
    if (currentHerbs.length > 0) {
      const suggestions = [];
      currentHerbs.forEach(herb => {
        if (herbSynergies[herb]) {
          herbSynergies[herb].forEach(synergy => {
            if (!currentHerbs.includes(synergy)) {
              suggestions.push({
                herb: synergy,
                reason: `Synergizes well with ${herb}`,
                quantity: 6
              });
            }
          });
        }
      });
      
      if (suggestions.length > 0) {
        return {
          type: 'herb_suggestions',
          suggestions: suggestions.slice(0, 3)
        };
      }
    }

    return null;
  };

  const analyzeCurrentFormula = () => {
    const currentHerbs = items.filter(item => item.herb_name && item.quantity_per_day);
    if (currentHerbs.length === 0) return null;

    const analysis = {
      herbCount: currentHerbs.length,
      totalQuantity: currentHerbs.reduce((sum, item) => sum + parseFloat(item.quantity_per_day || 0), 0),
      warnings: [],
      suggestions: [],
      synergies: []
    };

    // Check for contraindications
    currentHerbs.forEach(item => {
      // Ensure herb_name exists and is valid
      if (item.herb_name && herbContraindications[item.herb_name]) {
        analysis.warnings.push({
          herb: item.herb_name,
          chineseName: item.chinese_name || '',
          warnings: herbContraindications[item.herb_name]
        });
      }
    });

    // Check for synergies
    currentHerbs.forEach(item => {
      // Ensure herb_name exists and is valid
      if (item.herb_name && herbSynergies[item.herb_name]) {
        const presentSynergies = herbSynergies[item.herb_name].filter(synergy =>
          currentHerbs.some(h => h.herb_name === synergy)
        );
        if (presentSynergies.length > 0) {
          // Get Chinese names for synergistic herbs with safety checks
          const synergiesWithChinese = presentSynergies.map(synergy => {
            const synergyHerb = currentHerbs.find(h => h.herb_name === synergy);
            return synergyHerb && synergyHerb.chinese_name ? synergyHerb.chinese_name : '';
          });
          
          analysis.synergies.push({
            herb: item.herb_name,
            chineseName: item.chinese_name || '',
            synergizes_with: presentSynergies,
            synergizes_with_chinese: synergiesWithChinese
          });
        }
      }
    });

    // Formula balance suggestions
    if (analysis.totalQuantity > 60) {
      analysis.suggestions.push('Consider reducing total dosage - current formula may be too strong');
    }
    if (currentHerbs.length > 12) {
      analysis.suggestions.push('Formula is complex - consider simplifying for better patient compliance');
    }
    if (currentHerbs.length < 3) {
      analysis.suggestions.push('Consider adding harmonizing herbs like Licorice for formula balance');
    }

    return analysis;
  };

  const handleAiQuery = (query) => {
    if (!query.trim()) return;
    
    setAiProcessing(true);
    
    setTimeout(() => {
      const result = processAiQuery(query);
      
      if (result) {
        if (result.type === 'pattern_suggestion') {
          const formulaName = formatHerbName(result.data.baseFormula, result.data.baseFormulaChinese);
          setAiRecommendations([{
            type: 'formula',
            title: `Suggested Formula: ${formulaName}`,
            description: `For ${result.pattern} pattern`,
            herbs: result.data.herbs,
            action: 'apply_formula'
          }]);
        } else if (result.type === 'herb_suggestions') {
          setAiRecommendations([{
            type: 'herbs',
            title: 'Recommended Herb Additions',
            description: 'Based on current formula',
            suggestions: result.suggestions,
            action: 'add_herbs'
          }]);
        }
      } else {
        setAiRecommendations([{
          type: 'info',
          title: 'No specific recommendations found',
          description: 'Try describing symptoms or asking about herb combinations',
          action: 'none'
        }]);
      }
      
      setAiProcessing(false);
      setShowAiSuggestions(false);
    }, 800);
  };

  const applyAiRecommendation = (recommendation) => {
    if (recommendation.action === 'apply_formula' && recommendation.herbs) {
      const newItems = recommendation.herbs.map(herb => ({
        herb_id: null,
        herb_name: herb.name,
        chinese_name: herb.chinese,
        quantity_per_day: herb.quantity.toString(),
        notes: formatHerbName(herb.role, herb.roleChinese)
      }));
      setItems(newItems);
    } else if (recommendation.action === 'add_herbs' && recommendation.suggestions) {
      const newItems = [...items];
      recommendation.suggestions.forEach(suggestion => {
        newItems.push({
          herb_id: null,
          herb_name: suggestion.herb,
          chinese_name: '',
          quantity_per_day: suggestion.quantity.toString(),
          notes: suggestion.reason
        });
      });
      setItems(newItems);
    }
    setAiRecommendations([]);
  };

  const getAiSuggestions = (query) => {
    const suggestions = [
      "Kidney Yang Deficiency (肾阳虚) with cold limbs",
      "Spleen Qi Deficiency (脾气虚) with poor digestion", 
      "Heart Blood Deficiency (心血虚) with insomnia",
      "What herbs work well with Ginseng?",
      "Suggest formula for chronic fatigue",
      "Check current formula for balance",
      "Liver Qi Stagnation (肝气郁结) with stress",
      "Lung Yin Deficiency (肺阴虚) with dry cough"
    ];

    if (!query) return suggestions.slice(0, 4);
    
    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);
  };

  const handleAiInputChange = (value) => {
    setAiQuery(value);
    if (value.length > 0) {
      setAiSuggestions(getAiSuggestions(value));
      setShowAiSuggestions(true);
    } else {
      setShowAiSuggestions(false);
    }
  };

  // Update formula analysis when items change
  React.useEffect(() => {
    const analysis = analyzeCurrentFormula();
    setFormulaAnalysis(analysis);
  }, [items]);

  const addItem = () => {
    setItems([...items, { herb_id: null, herb_name: '', chinese_name: '', quantity_per_day: '', notes: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate items
    const validItems = items.filter(item => item.herb_name && item.quantity_per_day);
    if (validItems.length === 0) {
      setError('Please add at least one herb with quantity');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/prescriptions`, {
        ...formData,
        items: validItems.map(item => ({
          ...item,
          quantity_per_day: parseFloat(item.quantity_per_day)
        }))
      });

      navigate('/');
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Prescription</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Creating Prescription</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Patient Name *
            </label>
            <input
              type="text"
              name="patient_name"
              value={formData.patient_name}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="patient_dob"
              value={formData.patient_dob}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Patient Phone
            </label>
            <input
              type="tel"
              name="patient_phone"
              value={formData.patient_phone}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Treatment Days *
            </label>
            <input
              type="number"
              name="treatment_days"
              value={formData.treatment_days}
              onChange={handleFormChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Doses Per Day *
            </label>
            <select
              name="doses_per_day"
              value={formData.doses_per_day}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              required
            >
              <option value={1}>1 dose per day</option>
              <option value={2}>2 doses per day</option>
              <option value={3}>3 doses per day</option>
              <option value={4}>4 doses per day</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Each dose will be individually packaged
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Patient Address
          </label>
          <textarea
            name="patient_address"
            value={formData.patient_address}
            onChange={handleFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            rows="2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Symptoms & Clinical Presentation *
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              rows="4"
              placeholder="e.g., Fatigue, insomnia, cold hands and feet, pale tongue..."
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              TCM Diagnosis
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
              rows="4"
              placeholder="e.g., Kidney Yang Deficiency (肾阳虚), Spleen Qi Deficiency (脾气虚)..."
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Herbs</h3>
          </div>
          
          <div className="bg-primary-50 border-l-4 border-primary-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-primary-800">Prescription Instructions</h4>
                <div className="mt-2 text-sm text-primary-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Quantity per dose:</strong> Enter the amount of each herb needed for one dose (in grams)</li>
                    <li><strong>Individual packaging:</strong> Each dose will be packaged separately for patient convenience</li>
                    <li><strong>Total calculation:</strong> System will calculate total quantity needed automatically</li>
                    <li><strong>Example:</strong> 10g per dose × 2 doses/day × 7 days = 140g total (14 individual packets)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* AI Prescription Assistant */}
          <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-lg shadow p-6 mb-6 border-l-4 border-secondary-400">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-800">🧠 AI Prescription Assistant</h3>
              <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">TCM Expert</span>
            </div>
            
            <div className="relative mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Describe symptoms or ask for herb suggestions... e.g., 'Kidney Yang Deficiency (肾阳虚) with cold limbs'"
                    value={aiQuery}
                    onChange={(e) => handleAiInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiQuery(aiQuery)}
                    className="w-full px-4 py-3 border-2 border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors text-sm"
                    disabled={aiProcessing}
                  />
                  {aiProcessing && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAiQuery(aiQuery)}
                  disabled={!aiQuery.trim() || aiProcessing}
                  className="bg-primary-900 text-white px-6 py-3 rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {aiProcessing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              {/* AI Suggestions Dropdown */}
              {showAiSuggestions && aiSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-secondary-300 rounded-lg shadow-lg mt-1">
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-secondary-100 last:border-b-0 text-sm"
                      onClick={() => {
                        setAiQuery(suggestion);
                        handleAiQuery(suggestion);
                      }}
                    >
                      <span className="text-secondary-600">🔍</span> {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Pattern Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-secondary-600 mr-2">Common patterns:</span>
              {commonPatterns.map((pattern, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAiQuery(pattern.english);
                    handleAiQuery(pattern.english);
                  }}
                  className="bg-white border border-secondary-300 text-secondary-700 px-3 py-1 rounded-full text-xs hover:bg-secondary-50 hover:border-primary-300 transition-colors"
                >
                  {formatHerbName(pattern.english, pattern.chinese)}
                </button>
              ))}
            </div>

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <div className="space-y-3">
                {aiRecommendations.map((rec, index) => (
                  <div key={index} className="bg-white rounded-lg border border-primary-200 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-primary-800">{rec.title}</h4>
                        <p className="text-sm text-secondary-600">{rec.description}</p>
                      </div>
                      {rec.action !== 'none' && (
                        <button
                          onClick={() => applyAiRecommendation(rec)}
                          className="bg-primary-500 text-white px-3 py-1 rounded text-xs hover:bg-primary-600 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    
                    {rec.herbs && (
                      <div className="mt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {rec.herbs.map((herb, herbIndex) => (
                            <div key={herbIndex} className="bg-primary-50 p-2 rounded text-xs">
                              <div className="font-medium">{herb.name} ({herb.chinese})</div>
                              <div className="text-secondary-600">{herb.quantity}g - {herb.role}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {rec.suggestions && (
                      <div className="mt-3">
                        <div className="space-y-1">
                          {rec.suggestions.map((suggestion, suggIndex) => {
                            const chineseName = findHerbChineseName(suggestion.herb, items);
                            return (
                              <div key={suggIndex} className="bg-success-50 p-2 rounded text-xs">
                                <span className="font-medium">{formatHerbName(suggestion.herb, chineseName)}</span> - {suggestion.reason}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Current Formula Analysis */}
            {formulaAnalysis && formulaAnalysis.herbCount > 0 && (
              <div className="mt-4 bg-white rounded-lg border border-primary-200 p-4">
                <h4 className="font-medium text-primary-800 mb-3">📊 Current Formula Analysis</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{formulaAnalysis.herbCount}</div>
                    <div className="text-xs text-secondary-600">Herbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{formulaAnalysis.totalQuantity}g</div>
                    <div className="text-xs text-secondary-600">Total per dose</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-success-600">{formulaAnalysis.synergies.length}</div>
                    <div className="text-xs text-secondary-600">Synergies</div>
                  </div>
                </div>

                {formulaAnalysis.warnings.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-error-700 mb-1">⚠️ Safety Warnings:</h5>
                    {formulaAnalysis.warnings.map((warning, index) => (
                      <div key={index} className="bg-error-50 p-2 rounded text-xs mb-1">
                        <span className="font-medium">{formatHerbName(warning.herb, warning.chineseName)}:</span> {warning.warnings && Array.isArray(warning.warnings) ? warning.warnings.join(', ') : 'Unknown warning'}
                      </div>
                    ))}
                  </div>
                )}

                {formulaAnalysis.synergies.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-success-700 mb-1">✅ Herb Synergies:</h5>
                    {formulaAnalysis.synergies.map((synergy, index) => {
                      // Format synergistic herbs with bilingual names with safety checks
                      const synergyList = synergy.synergizes_with && Array.isArray(synergy.synergizes_with) 
                        ? synergy.synergizes_with.map((synergyHerb, synergyIndex) => {
                            const chineseName = synergy.synergizes_with_chinese && synergy.synergizes_with_chinese[synergyIndex] 
                              ? synergy.synergizes_with_chinese[synergyIndex] 
                              : '';
                            return formatHerbName(synergyHerb, chineseName);
                          }).join(', ')
                        : 'Unknown synergies';
                      
                      return (
                        <div key={index} className="bg-success-50 p-2 rounded text-xs mb-1">
                          <span className="font-medium">{formatHerbName(synergy.herb, synergy.chineseName)}</span> works well with {synergyList}
                        </div>
                      );
                    })}
                  </div>
                )}

                {formulaAnalysis.suggestions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-primary-700 mb-1">💡 Suggestions:</h5>
                    {formulaAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-primary-50 p-2 rounded text-xs mb-1">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <HerbDualInput
                    englishValue={item.herb_name}
                    chineseValue={item.chinese_name}
                    onEnglishChange={(value) => handleEnglishNameChange(index, value)}
                    onChineseChange={(value) => handleChineseNameChange(index, value)}
                    onSelect={(herbData) => handleHerbSelect(index, herbData)}
                    required
                  />
                  <div className="text-xs text-secondary-500 mt-2">
                    💡 <strong>Tip:</strong> You can search in either field - selecting from suggestions will auto-fill both names.
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Quantity per Dose (grams) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={item.quantity_per_day}
                      onChange={(e) => handleItemChange(index, 'quantity_per_day', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Notes for this herb
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                      placeholder="e.g., 'Use organic grade (有机等级)', 'Source from specific region (特定产地)', 'Emperor herb (君药)'..."
                    />
                  </div>
                </div>
                
                {/* Remove Herb Button - moved to separate row for better UX */}
                {items.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-error-500 text-white px-4 py-2 rounded-lg hover:bg-error-600 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Herb
                    </button>
                  </div>
                )}
              </div>
              

            </div>
          ))}
          
          {/* Add Herb Button - placed after herb list for better UX */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={addItem}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Herb
            </button>
          </div>
        </div>

        {/* Prescription Summary */}
        {items.some(item => item.quantity_per_day && item.herb_name) && (
          <div className="mb-6 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-800 mb-4">📋 Prescription Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Treatment Overview */}
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <h4 className="font-medium text-secondary-800 mb-3">Treatment Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Treatment Duration:</span>
                    <span className="font-medium">{formData.treatment_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Doses per Day:</span>
                    <span className="font-medium">{formData.doses_per_day} doses</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-secondary-600">Total Packets:</span>
                    <span className="font-bold text-primary-600">{formData.treatment_days * formData.doses_per_day} packets</span>
                  </div>
                </div>
              </div>

              {/* Herb Quantities */}
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <h4 className="font-medium text-secondary-800 mb-3">Total Herb Quantities</h4>
                <div className="space-y-2 text-sm">
                  {items
                    .filter(item => item.quantity_per_day && item.herb_name)
                    .map((item, index) => {
                      const totalQuantity = (parseFloat(item.quantity_per_day) * formData.treatment_days * formData.doses_per_day).toFixed(1);
                      return (
                        <div key={index} className="flex justify-between">
                          <span className="text-secondary-600 truncate mr-2">
                            {item.herb_name} {item.chinese_name && `(${item.chinese_name})`}:
                          </span>
                          <span className="font-medium">{totalQuantity}g</span>
                        </div>
                      );
                    })
                  }
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium text-secondary-800">Total Formula Weight:</span>
                    <span className="font-bold text-primary-600">
                      {items
                        .filter(item => item.quantity_per_day && item.herb_name)
                        .reduce((total, item) => {
                          return total + (parseFloat(item.quantity_per_day) * formData.treatment_days * formData.doses_per_day);
                        }, 0)
                        .toFixed(1)
                      }g
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formula Composition */}
            <div className="mt-4 bg-white rounded-lg p-4 border border-primary-200">
              <h4 className="font-medium text-secondary-800 mb-3">Formula Composition (per packet)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                {items
                  .filter(item => item.quantity_per_day && item.herb_name)
                  .map((item, index) => (
                    <div key={index} className="flex justify-between bg-secondary-50 px-2 py-1 rounded">
                      <span className="text-secondary-600 truncate mr-1">
                        {item.herb_name.split(' ')[0]}:
                      </span>
                      <span className="font-medium">{item.quantity_per_day}g</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            General Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
            rows="3"
            placeholder="Any special instructions or notes..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2 text-secondary-700 hover:text-secondary-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-900 text-white px-6 py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-all duration-200 shadow-md flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Prescription...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Prescription
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePrescription;