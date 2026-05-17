# Specification: Enhance AI Extraction for Automated Violation Chronology

## Overview
This track aims to improve the accuracy and depth of the AI-driven data extraction from PDF inspection reports. Currently, the system uses the Anthropic Claude API to parse historical reports. We will refine the prompt engineering and data mapping to ensure that violations are extracted with 100% adherence to SF Health Code Article 11 and that the chronology matrix is seeded with precise, structured data.

## Objectives
- Improve extraction accuracy for violation codes and descriptions.
- Ensure all extracted violations are mapped correctly to SFHC Article 11.
- Automate the population of the Chronology Matrix from parsed data.
- Reduce manual remediation required after PDF ingestion.

## Requirements
- Refine Anthropic API prompts in `packetService.ts` or related services.
- Update data validation logic to strictly enforce local code standards.
- Implement a structured review interface for AI-extracted data before it is committed to the chronology.