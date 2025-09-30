import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const HerbDualInput = ({ 
  englishValue, 
  chineseValue, 
  onEnglishChange, 
  onChineseChange, 
  onSelect, 
  required = false 
}) => {
  const [englishSuggestions, setEnglishSuggestions] = useState([]);
  const [chineseSuggestions, setChineseSuggestions] = useState([]);
  const [showEnglishSuggestions, setShowEnglishSuggestions] = useState(false);
  const [showChineseSuggestions, setShowChineseSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const englishInputRef = useRef(null);
  const chineseInputRef = useRef(null);

  // Search herbs by English name
  useEffect(() => {
    const searchEnglishHerbs = async () => {
      if (englishValue && englishValue.length >= 1) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/prescriptions/herbs/search?q=${encodeURIComponent(englishValue)}&lang=en`
          );
          setEnglishSuggestions(response.data);
          setShowEnglishSuggestions(true);
        } catch (error) {
          console.error('Error searching English herbs:', error);
          setEnglishSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setEnglishSuggestions([]);
        setShowEnglishSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(searchEnglishHerbs, 200);
    return () => clearTimeout(debounceTimer);
  }, [englishValue]);

  // Search herbs by Chinese name
  useEffect(() => {
    const searchChineseHerbs = async () => {
      if (chineseValue && chineseValue.length >= 1) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/prescriptions/herbs/search?q=${encodeURIComponent(chineseValue)}&lang=zh`
          );
          setChineseSuggestions(response.data);
          setShowChineseSuggestions(true);
        } catch (error) {
          console.error('Error searching Chinese herbs:', error);
          setChineseSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setChineseSuggestions([]);
        setShowChineseSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(searchChineseHerbs, 200);
    return () => clearTimeout(debounceTimer);
  }, [chineseValue]);

  const handleEnglishSuggestionClick = (herb) => {
    onEnglishChange(herb.name);
    onChineseChange(herb.chinese_name || '');
    onSelect({
      herb_id: herb.id,
      herb_name: herb.name,
      chinese_name: herb.chinese_name
    });
    setShowEnglishSuggestions(false);
  };

  const handleChineseSuggestionClick = (herb) => {
    onEnglishChange(herb.name);
    onChineseChange(herb.chinese_name || '');
    onSelect({
      herb_id: herb.id,
      herb_name: herb.name,
      chinese_name: herb.chinese_name
    });
    setShowChineseSuggestions(false);
  };

  const handleEnglishKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowEnglishSuggestions(false);
    }
  };

  const handleChineseKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowChineseSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        englishInputRef.current && 
        !englishInputRef.current.contains(event.target) &&
        chineseInputRef.current && 
        !chineseInputRef.current.contains(event.target)
      ) {
        setShowEnglishSuggestions(false);
        setShowChineseSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* English Name Field */}
      <div className="relative" ref={englishInputRef}>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          English Name {required && '*'}
        </label>
        <input
          type="text"
          value={englishValue}
          onChange={(e) => onEnglishChange(e.target.value)}
          onKeyDown={handleEnglishKeyDown}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
          placeholder="e.g., Ginseng, Astragalus"
          required={required}
        />
        
        {showEnglishSuggestions && englishSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {englishSuggestions.map((herb) => (
              <div
                key={herb.id}
                className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-secondary-100 last:border-b-0"
                onClick={() => handleEnglishSuggestionClick(herb)}
              >
                <div className="font-medium text-secondary-900">{herb.name}</div>
                {herb.chinese_name && (
                  <div className="text-sm text-secondary-600">{herb.chinese_name}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {loading && showEnglishSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg">
            <div className="px-4 py-2 text-secondary-500">Searching...</div>
          </div>
        )}
      </div>

      {/* Chinese Name Field */}
      <div className="relative" ref={chineseInputRef}>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Chinese Name (中文名)
        </label>
        <input
          type="text"
          value={chineseValue}
          onChange={(e) => onChineseChange(e.target.value)}
          onKeyDown={handleChineseKeyDown}
          className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
          placeholder="e.g., 人参, 黄芪"
        />
        
        {showChineseSuggestions && chineseSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {chineseSuggestions.map((herb) => (
              <div
                key={herb.id}
                className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-secondary-100 last:border-b-0"
                onClick={() => handleChineseSuggestionClick(herb)}
              >
                <div className="font-medium text-secondary-900">{herb.chinese_name}</div>
                {herb.name && (
                  <div className="text-sm text-secondary-600">{herb.name}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {loading && showChineseSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-lg">
            <div className="px-4 py-2 text-secondary-500">Searching...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HerbDualInput;