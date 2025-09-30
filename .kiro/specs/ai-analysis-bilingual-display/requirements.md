# Requirements Document

## Introduction

This feature enhances the AI Prescription Assistant's formula analysis display by showing both English and Chinese herb names in the safety warnings and herb synergies sections. Currently, only English names are displayed, which reduces readability for TCM practitioners who are more familiar with Chinese herb names in clinical practice.

## Requirements

### Requirement 1

**User Story:** As a TCM practitioner, I want to see both English and Chinese herb names in the AI analysis safety warnings, so that I can quickly identify herbs using the names I'm most familiar with.

#### Acceptance Criteria

1. WHEN the AI analysis displays safety warnings THEN the system SHALL show both English and Chinese names for each herb
2. WHEN a herb has both English and Chinese names available THEN the system SHALL display them in the format "English Name (Chinese Name)"
3. WHEN a herb only has an English name available THEN the system SHALL display only the English name
4. WHEN a herb only has a Chinese name available THEN the system SHALL display only the Chinese name

### Requirement 2

**User Story:** As a TCM practitioner, I want to see both English and Chinese herb names in the herb synergies section, so that I can better understand which herbs work well together using familiar terminology.

#### Acceptance Criteria

1. WHEN the AI analysis displays herb synergies THEN the system SHALL show both English and Chinese names for the primary herb
2. WHEN the AI analysis displays herb synergies THEN the system SHALL show both English and Chinese names for the synergistic herbs
3. WHEN displaying synergy relationships THEN the system SHALL maintain the format "Primary Herb (Chinese) works well with Synergy1 (Chinese), Synergy2 (Chinese)"
4. IF a herb name is not available in one language THEN the system SHALL display only the available name

### Requirement 3

**User Story:** As a TCM practitioner, I want the bilingual display to be consistent across all AI analysis sections, so that I have a uniform experience when reviewing formula analysis.

#### Acceptance Criteria

1. WHEN displaying herb names in any AI analysis section THEN the system SHALL use consistent formatting for bilingual names
2. WHEN the same herb appears in multiple analysis sections THEN the system SHALL display the same name format consistently
3. WHEN herbs are referenced in analysis text THEN the system SHALL prioritize showing both names when available