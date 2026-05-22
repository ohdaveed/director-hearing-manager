-- =============================================================================
-- Function: validate_hearing_packet
-- Validates a hearing packet against SFDPH SOP requirements.
-- =============================================================================

DROP FUNCTION IF EXISTS public.validate_hearing_packet(UUID);

CREATE OR REPLACE FUNCTION public.validate_hearing_packet(p_hearing_packet_id UUID)
RETURNS TABLE (
    rule_slug TEXT,
    status TEXT,
    severity TEXT,
    message TEXT
) AS $$
DECLARE
    v_packet RECORD;
BEGIN
    -- 1. Fetch the packet data
    SELECT * INTO v_packet 
    FROM public.hearing_packets 
    WHERE id = p_hearing_packet_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT 'SYSTEM-001'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Packet not found'::TEXT;
        RETURN;
    END IF;

    -- SOP-001: Cover Page Structure (Case Number Format)
    -- Format expected: #HHP-YY-XX (e.g. #HHP-25-05)
    IF v_packet.case_number IS NULL OR v_packet.case_number = '' THEN
        RETURN QUERY SELECT 'SOP-001'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Case number is missing'::TEXT;
    ELSIF v_packet.case_number !~ '^#HHP-\d{2}-\d{2}$' THEN
        RETURN QUERY SELECT 'SOP-001'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Case number format is invalid (expected #HHP-YY-XX)'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-001'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Case number format is valid'::TEXT;
    END IF;

    -- SOP-002: Enforcement Action Summary
    -- Check if enforcement_json has data or proposed_actions is not empty
    IF (v_packet.enforcement_json IS NULL OR v_packet.enforcement_json = '{}'::jsonb) 
       AND (v_packet.proposed_actions IS NULL OR array_length(v_packet.proposed_actions, 1) = 0) THEN
        RETURN QUERY SELECT 'SOP-002'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Enforcement summary is missing'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-002'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Enforcement summary present'::TEXT;
    END IF;

    -- SOP-004: Case Chronology alignment
    IF v_packet.chronology_snapshot IS NULL OR v_packet.chronology_snapshot = '' THEN
        RETURN QUERY SELECT 'SOP-004'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Case chronology snapshot is missing'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-004'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Case chronology snapshot present'::TEXT;
    END IF;

    -- SOP-005: Exhibit Labeling
    IF NOT COALESCE(v_packet.exhibit_labeling_complete, false) THEN
        RETURN QUERY SELECT 'SOP-005'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Exhibit labeling is incomplete'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-005'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Exhibit labeling complete'::TEXT;
    END IF;

    -- SOP-009: Photo Presentation
    -- Check if page numbering is complete as a proxy for photo layout
    IF NOT COALESCE(v_packet.page_numbering_complete, false) THEN
        RETURN QUERY SELECT 'SOP-009'::TEXT, 'fail'::TEXT, 'warning'::TEXT, 'Page numbering/layout is incomplete'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-009'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Page numbering complete'::TEXT;
    END IF;

    -- SOP-010: Notice Timeline (14 Days)
    IF v_packet.hearing_date IS NULL OR v_packet.notice_service_date IS NULL THEN
        RETURN QUERY SELECT 'SOP-010'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Hearing date or Notice Service date is missing'::TEXT;
    ELSIF (v_packet.hearing_date - v_packet.notice_service_date) < 14 THEN
        RETURN QUERY SELECT 'SOP-010'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Notice must be served at least 14 days before the hearing'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-010'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Notice timeline requirement met'::TEXT;
    END IF;

    -- SOP-012: Submission Timeline (5 Days)
    -- Using generated_at (which is when the packet is finalized/compiled)
    IF v_packet.hearing_date IS NULL OR v_packet.generated_at IS NULL THEN
        RETURN QUERY SELECT 'SOP-012'::TEXT, 'warning'::TEXT, 'major'::TEXT, 'Final packet submission timeline cannot be verified (missing data)'::TEXT;
    ELSIF (v_packet.hearing_date - v_packet.generated_at::date) < 5 THEN
        RETURN QUERY SELECT 'SOP-012'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Final package must be delivered 5 days prior to hearing'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SOP-012'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Submission timeline requirement met'::TEXT;
    END IF;

    -- Signatures (Custom Rules)
    IF v_packet.inspector_signature IS NULL OR v_packet.inspector_signature = '' THEN
        RETURN QUERY SELECT 'SIG-001'::TEXT, 'fail'::TEXT, 'critical'::TEXT, 'Inspector signature is missing'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SIG-001'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Inspector signature present'::TEXT;
    END IF;

    IF v_packet.manager_signature IS NULL OR v_packet.manager_signature = '' THEN
        RETURN QUERY SELECT 'SIG-002'::TEXT, 'fail'::TEXT, 'major'::TEXT, 'Manager countersign is missing'::TEXT;
    ELSE
        RETURN QUERY SELECT 'SIG-002'::TEXT, 'pass'::TEXT, 'info'::TEXT, 'Manager countersign present'::TEXT;
    END IF;

END;
$$ LANGUAGE plpgsql STABLE;
