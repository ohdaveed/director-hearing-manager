# Plan: Enhance AI Extraction for Automated Violation Chronology

## Phase 1: Research and Baselining [checkpoint: 74f61d1]
- [x] Task: Audit current AI extraction logic and identify common failure points in PDF parsing. (Logic is currently missing/mocked in UI via zite-endpoints-sdk; Anthropic SDK installed but unused)
- [x] Task: Gather a dataset of "edge case" inspection reports for testing. (Created mock_reports.json)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Research and Baselining' (Protocol in workflow.md) [74f61d1]

## Phase 2: Refinement of Extraction Engine [checkpoint: 2956333]
- [x] Task: Update Anthropic API prompt templates to improve structure and accuracy of returned JSON. [2956333]
    - [x] Task: Write failing tests for prompt response parsing.
    - [x] Task: Implement updated prompt logic to pass tests.
- [x] Task: Integrate SFHC Article 11 validation rules directly into the parsing post-processor. [2956333]
    - [x] Task: Write failing tests for code validation.
    - [x] Task: Implement validation logic to pass tests.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Refinement of Extraction Engine' (Protocol in workflow.md) [2956333]

## Phase 3: Integration and Validation [checkpoint: 8bbd32b]
- [x] Task: Update the "Import Past Inspections" wizard to support the new structured data format. [8bbd32b]
- [x] Task: Perform end-to-end testing with the "edge case" dataset to verify accuracy improvements. [8bbd32b]
- [x] Task: Conductor - User Manual Verification 'Phase 3: Integration and Validation' (Protocol in workflow.md) [8bbd32b]