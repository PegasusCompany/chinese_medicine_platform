import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const HerbAutocomplete = ({ value, onChange, onSelect, placeholder, required = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const searchHerbs = async () => {
      if (value && value.length >= 1) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/prescriptions/herbs/search?q=${encodeURIComponent(value)}`
          );
          setSuggestions(response.data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error searching herbs:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(searchHerbs, 200);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (herb) => {
    const displayName = `${herb.name} (${herb.chinese_name || 'N/A'})`;
    onChange(displayName);
    onSelect({
      herb_id: herb.id,
      herb_name: herb.name,
      chinese_name: herb.chinese_name,
      category: herb.category
    });
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((herb, index) => (
            <div
              key={herb.id}
              onClick={() => handleSuggestionClick(herb)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {highlightMatch(herb.name, value)}
                  </div>
                  {herb.chinese_name && (
                    <div className="text-sm text-gray-600">
                      {highlightMatch(herb.chinese_name, value)}
                    </div>
                  )}
                  {herb.category && (
                    <div className="text-xs text-blue-600 mt-1">
                      {herb.category}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && value && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">
            No herbs found. You can still add "{value}" as a custom herb.
          </div>
        </div>
      )}
    </div>
  );
};

export default HerbAutocomplete;