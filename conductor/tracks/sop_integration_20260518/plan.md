# Implementation Plan: SOP Integration

## Goal

Integrate the formal "Director's Hearing SOP" into the application's database and AI validation logic to ensure all generated packets meet SFDPH legal standards.

## Phase 0: Research & Reconcile (Context7)

- Reconcile SOP requirements with existing database schema using Context7 documentation.
- Verify existing `compliance_rules` table structure against planned enhancements.

## Phase 1: Database Rules Table

- Create `compliance_rules` table to store formal SOP requirements (Completed in Migration 003b).
- Seed rules:
  - SOP-001: Cover Page Format
  - SOP-002: Enforcement Summary Components
  - SOP-010: 14-Day Notice Timeline
  - SOP-012: 5-Day Submission Timeline
  - Exhibit red-labeling requirements.

## Phase 2: AI Prompt Enhancement

- Update `src/services/aiService.ts` to include the specific granular rules extracted from the SOP.
- Map the rules to the `ComplianceResult` issue IDs for better error reporting in the UI.

## Phase 3: Application Validation Logic

- Implement hard validation in `src/hooks/usePacketReviewStatus.ts` (or equivalent) to check for missing signatures and timeline violations (e.g., Notice Date < 14 days before Hearing Date) before allowing submission.

## Completion Criteria

- New packets are automatically validated against the 14 key rules identified in the SOP.
- The UI displays specific SOP rule IDs (e.g., "Violation of SOP-010") when a packet is non-compliant.
