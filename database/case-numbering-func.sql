-- Function to safely increment and get the next case number
-- Handles year transitions and formatting

CREATE OR REPLACE FUNCTION get_next_case_number(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_format text;
    v_last_year integer;
    v_last_number integer;
    
    v_current_year integer;
    v_new_number integer;
    v_formatted_id text;
BEGIN
    -- 1. Get current settings and lock the org row to prevent race conditions
    SELECT 
        case_number_format, 
        last_case_year, 
        last_case_number
    INTO 
        v_format, 
        v_last_year, 
        v_last_number
    FROM organizations
    WHERE id = p_org_id
    FOR UPDATE; -- Locks the row

    v_current_year := date_part('year', now())::integer;
    v_last_year := COALESCE(v_last_year, v_current_year);
    v_last_number := COALESCE(v_last_number, 0);
    v_format := COALESCE(v_format, 'year_seq');

    -- 2. Determine new number
    IF v_format = 'year_seq' THEN
        -- Check if we entered a new year
        IF v_current_year > v_last_year THEN
            v_new_number := 1; -- Reset for new year
        ELSE
            v_new_number := v_last_number + 1;
        END IF;
        
        -- Format: YY/NNN (e.g., 24/001)
        -- Taking last 2 digits of year
        v_formatted_id := to_char(v_current_year % 100, 'FM00') || '/' || to_char(v_new_number, 'FM000');
    ELSE
        -- Sequential (ignores year reset, just increments)
        v_new_number := v_last_number + 1;
        v_formatted_id := v_new_number::text;
    END IF;

    -- 3. Update organization
    UPDATE organizations
    SET 
        last_case_year = v_current_year,
        last_case_number = v_new_number
    WHERE id = p_org_id;

    -- 4. Return result
    RETURN jsonb_build_object(
        'year', v_current_year,
        'number', v_new_number,
        'formatted', v_formatted_id
    );
END;
$$;
