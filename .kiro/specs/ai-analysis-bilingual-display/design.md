# Design Document

## Overview

This design implements bilingual herb name display in the AI Prescription Assistant's formula analysis sections. The enhancement will modify the existing analysis display logic to show both English and Chinese herb names when available, improving readability for TCM practitioners.

## Architecture

The solution involves modifying the existing `CreatePrescription` component's formula analysis display logic. The changes will be contained within the React component and will not require backend modifications since the herb data (including Chinese names) is already available in the component state.

### Current State
- Safety warnings show only English herb names
- Herb synergies show only English herb names  
- Herb data includes both `herb_name` (English) and `chinese_name` fields
- Analysis logic uses hardcoded English names for lookups

### Target State
- All analysis sections display bilingual herb names when available
- Consistent formatting across all analysis sections
- Graceful fallback when one language name is missing

## Components and Interfaces

### Modified Components

#### CreatePrescription Component
- **Location**: `frontend/src/pages/CreatePrescription.js`
- **Modifications**: 
  - Add helper function for bilingual name formatting
  - Update safety warnings display logic
  - Update herb synergies display logic
  - Ensure consistent formatting across analysis sections

### Helper Functions

#### `formatHerbName(englishName, chineseName)`
- **Purpose**: Create consistent bilingual herb name display
- **Parameters**:
  - `englishName` (string): English herb name
  - `chineseName` (string): Chinese herb name
- **Returns**: Formatted string with both names or single available name
- **Logic**:
  - If both names available: "English Name (Chinese Name)"
  - If only English available: "English Name"
  - If only Chinese available: "Chinese Name"
  - If neither available: "Unknown Herb"

#### `findHerbChineseName(englishName, items)`
- **Purpose**: Find Chinese name for a given English herb name from current prescription items
- **Parameters**:
  - `englishName` (string): English herb name to look up
  - `items` (array): Current prescription items array
- **Returns**: Chinese name string or empty string if not found

## Data Models

### Existing Data Structures
The component already has access to the required data through the `items` state:

```javascript
items = [
  {
    herb_id: number,
    herb_name: string,      // English name
    chinese_name: string,   // Chinese name
    quantity_per_day: string,
    notes: string
  }
]
```

### Analysis Data Structures
The existing analysis structures will be enhanced to include Chinese names:

```javascript
// Enhanced warning structure
warning = {
  herb: string,           // English name
  chineseName: string,    // Chinese name (new)
  warnings: string[]
}

// Enhanced synergy structure  
synergy = {
  herb: string,           // English name
  chineseName: string,    // Chinese name (new)
  synergizes_with: string[], // English names
  synergizes_with_chinese: string[] // Chinese names (new)
}
```

## Error Handling

### Missing Name Scenarios
- **Missing Chinese name**: Display only English name
- **Missing English name**: Display only Chinese name (rare case)
- **Both names missing**: Display "Unknown Herb" with warning

### Data Consistency
- Validate that herb names exist before formatting
- Handle empty strings and null values gracefully
- Maintain existing functionality if bilingual enhancement fails

## Testing Strategy

### Unit Testing Areas
1. **Helper Functions**:
   - Test `formatHerbName()` with various input combinations
   - Test `findHerbChineseName()` with different item arrays
   - Verify edge cases (empty strings, null values)

2. **Display Logic**:
   - Verify safety warnings show bilingual names
   - Verify herb synergies show bilingual names
   - Test consistency across different analysis sections

3. **Integration Testing**:
   - Test with real prescription data
   - Verify no regression in existing functionality
   - Test with herbs that have only English or only Chinese names

### Manual Testing Scenarios
1. Create prescription with herbs having both English and Chinese names
2. Create prescription with herbs having only English names
3. Verify analysis sections display names consistently
4. Test with various herb combinations to ensure synergy display works

## Implementation Approach

### Phase 1: Helper Functions
- Implement `formatHerbName()` utility function
- Implement `findHerbChineseName()` lookup function
- Add unit tests for helper functions

### Phase 2: Analysis Enhancement
- Modify `analyzeCurrentFormula()` to include Chinese names in analysis results
- Update safety warnings display to use bilingual formatting
- Update herb synergies display to use bilingual formatting

### Phase 3: Consistency & Polish
- Ensure consistent formatting across all analysis sections
- Add error handling for edge cases
- Verify no performance impact on analysis calculations

## Technical Considerations

### Performance
- Minimal performance impact as changes are display-only
- Lookup operations are O(n) where n is number of herbs in prescription (typically < 20)
- No additional API calls required

### Maintainability
- Helper functions promote code reuse
- Centralized formatting logic makes future changes easier
- Clear separation between data processing and display logic

### Accessibility
- Bilingual display improves accessibility for practitioners
- Maintains existing screen reader compatibility
- No changes to semantic HTML structure required