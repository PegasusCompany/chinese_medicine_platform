# Implementation Plan

- [x] 1. Create helper functions for bilingual herb name formatting
  - Implement `formatHerbName(englishName, chineseName)` utility function that handles various name combinations
  - Implement `findHerbChineseName(englishName, items)` function to lookup Chinese names from current prescription items
  - Add comprehensive error handling for null/undefined/empty values
  - _Requirements: 1.2, 1.3, 1.4, 2.4, 3.1_

- [x] 2. Enhance formula analysis data structure to include Chinese names
  - Modify `analyzeCurrentFormula()` function to populate Chinese names in warning objects
  - Update warning data structure to include `chineseName` field alongside existing `herb` field
  - Modify synergy analysis to include Chinese names for both primary herbs and synergistic herbs
  - Update synergy data structure to include `chineseName` and `synergizes_with_chinese` arrays
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 3. Update safety warnings display to show bilingual herb names
  - Modify the safety warnings rendering section in the JSX to use bilingual formatting
  - Replace single herb name display with formatted bilingual names using helper function
  - Ensure consistent formatting across all warning messages
  - Test display with various name combinations (both names, English only, Chinese only)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_

- [x] 4. Update herb synergies display to show bilingual herb names
  - Modify the herb synergies rendering section to display bilingual names for primary herbs
  - Update synergistic herbs list to show bilingual names for each synergistic herb
  - Maintain the existing "works well with" format while incorporating Chinese names
  - Ensure proper comma separation and formatting for multiple synergistic herbs
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

- [x] 5. Implement consistent formatting across all analysis sections
  - Review all herb name references in the analysis display components
  - Apply bilingual formatting to any remaining single-language herb name displays
  - Verify consistent formatting pattern is used throughout the analysis sections
  - Test with various herb combinations to ensure consistency
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Add error handling and edge case management
  - Implement graceful fallback when herb names are missing or invalid
  - Add validation to prevent display of empty parentheses or malformed names
  - Handle cases where herbs in analysis don't match current prescription items
  - Add defensive programming for undefined or null herb data
  - _Requirements: 1.3, 1.4, 2.4_

- [x] 7. Test bilingual display functionality with comprehensive scenarios
  - Create test prescription with herbs having both English and Chinese names
  - Test with herbs having only English names to verify fallback behavior
  - Test with herbs having only Chinese names to verify fallback behavior
  - Verify analysis sections display consistently formatted names
  - Test synergy relationships show proper bilingual formatting for all herbs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_