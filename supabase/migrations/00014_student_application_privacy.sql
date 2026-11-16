-- Keep scoring configuration and draft scores private to the selection team.
DROP POLICY IF EXISTS criteria_select_authenticated ON criteria;
CREATE POLICY criteria_select_admin ON criteria
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS scales_select_authenticated ON criteria_scales;
CREATE POLICY scales_select_admin ON criteria_scales
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS app_values_select_own ON application_values;
DROP POLICY IF EXISTS app_values_insert_own ON application_values;
DROP POLICY IF EXISTS app_values_update_own ON application_values;

CREATE POLICY app_values_select_own_published ON application_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN scholarship_periods sp ON sp.id = a.period_id
      WHERE a.id = application_id
        AND a.user_id = auth.uid()
        AND sp.status = 'published'
    )
  );

CREATE OR REPLACE FUNCTION get_student_application_form(p_application_id UUID)
RETURNS TABLE (
  criteria_id UUID,
  nama TEXT,
  urutan INTEGER,
  nilai_mentah NUMERIC,
  scale_id UUID,
  scale_label TEXT,
  selected_scale_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Student access required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM applications
    WHERE id = p_application_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.nama,
    c.urutan,
    av.nilai_mentah,
    s.id,
    s.label,
    selected_scale.id
  FROM applications a
  JOIN criteria c ON c.period_id = a.period_id
  LEFT JOIN application_values av
    ON av.application_id = a.id AND av.criteria_id = c.id
  LEFT JOIN criteria_scales s ON s.criteria_id = c.id
  LEFT JOIN LATERAL (
    SELECT matching_scale.id
    FROM criteria_scales matching_scale
    WHERE matching_scale.criteria_id = c.id
      AND av.nilai_mentah BETWEEN matching_scale.nilai_min AND matching_scale.nilai_max
    ORDER BY matching_scale.nilai_min, matching_scale.id
    LIMIT 1
  ) selected_scale ON TRUE
  WHERE a.id = p_application_id AND a.user_id = auth.uid()
  ORDER BY c.urutan, s.nilai_min, s.id;
END;
$$;

REVOKE ALL ON FUNCTION get_student_application_form(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_student_application_form(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION save_student_application_values(
  p_application_id UUID,
  p_period_id UUID,
  p_values JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_application_period_id UUID;
  v_application_status TEXT;
  v_period_status TEXT;
  v_item JSONB;
  v_criteria_id UUID;
  v_scale_id UUID;
  v_raw_value NUMERIC;
  v_score NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Student access required';
  END IF;

  SELECT a.period_id, a.status::TEXT, sp.status::TEXT
    INTO v_application_period_id, v_application_status, v_period_status
  FROM applications a
  JOIN scholarship_periods sp ON sp.id = a.period_id
  WHERE a.id = p_application_id AND a.user_id = auth.uid();

  IF NOT FOUND OR v_application_period_id <> p_period_id THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF v_application_status <> 'draft' OR v_period_status <> 'open' THEN
    RAISE EXCEPTION 'Application is not editable';
  END IF;

  IF jsonb_typeof(p_values) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid application values';
  END IF;

  FOR v_item IN
    SELECT entry.value
    FROM jsonb_array_elements(p_values) AS entry(value)
  LOOP
    v_criteria_id := (v_item->>'criteria_id')::UUID;
    v_scale_id := NULLIF(v_item->>'selected_scale_id', '')::UUID;
    v_raw_value := NULLIF(v_item->>'nilai_mentah', '')::NUMERIC;

    IF NOT EXISTS (
      SELECT 1
      FROM criteria
      WHERE id = v_criteria_id AND period_id = p_period_id
    ) THEN
      RAISE EXCEPTION 'Invalid application criterion';
    END IF;

    IF v_scale_id IS NULL AND v_raw_value IS NULL THEN
      DELETE FROM application_values
      WHERE application_id = p_application_id
        AND criteria_id = v_criteria_id;
      CONTINUE;
    END IF;

    IF v_scale_id IS NOT NULL THEN
      SELECT nilai_min, skor
        INTO v_raw_value, v_score
      FROM criteria_scales
      WHERE id = v_scale_id AND criteria_id = v_criteria_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid scale for application criterion';
      END IF;
    ELSE
      IF EXISTS (
        SELECT 1
        FROM criteria_scales
        WHERE criteria_id = v_criteria_id
      ) THEN
        RAISE EXCEPTION 'A scale selection is required for this criterion';
      END IF;

      v_score := v_raw_value;
    END IF;

    INSERT INTO application_values (
      application_id,
      criteria_id,
      nilai_mentah,
      skor,
      updated_at
    )
    VALUES (
      p_application_id,
      v_criteria_id,
      v_raw_value,
      v_score,
      now()
    )
    ON CONFLICT (application_id, criteria_id)
    DO UPDATE SET
      nilai_mentah = EXCLUDED.nilai_mentah,
      skor = EXCLUDED.skor,
      updated_at = EXCLUDED.updated_at;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION save_student_application_values(UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_student_application_values(UUID, UUID, JSONB) TO authenticated;
