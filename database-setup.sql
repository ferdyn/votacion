-- Función para incrementar votos (stored procedure)
CREATE OR REPLACE FUNCTION incrementar_voto(
  p_departamento TEXT,
  p_candidato TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_resultado_id UUID;
  v_candidatos JSONB;
BEGIN
  -- Intentar insertar un nuevo registro o actualizar uno existente
  INSERT INTO resultados_votacion (departamento_id, candidatos)
  VALUES (p_departamento, '[]'::jsonb)
  ON CONFLICT (departamento_id) 
  DO UPDATE SET candidatos = resultados_votacion.candidatos
  RETURNING id, candidatos INTO v_resultado_id, v_candidatos;

  -- Buscar si el candidato ya existe en el array
  IF jsonb_path_exists(v_candidatos, ('$[*] ? (@.id == "' || p_candidato || '")')::jsonpath) THEN
    -- Incrementar los votos del candidato existente
    UPDATE resultados_votacion
    SET candidatos = jsonb_set(
      candidatos,
      '{' || (jsonb_array_position(candidatos, jsonb_build_object('id', p_candidato)) - 1) || ',votos}',
      to_jsonb((candidatos->jsonb_array_position(candidatos, jsonb_build_object('id', p_candidato))->'votos')::int + 1),
      false
    )
    WHERE id = v_resultado_id;
  ELSE
    -- Agregar nuevo candidato
    UPDATE resultados_votacion
    SET candidatos = candidatos || jsonb_build_object('id', p_candidato, 'votos', 1)
    WHERE id = v_resultado_id;
  END IF;

  -- Registrar el voto en la tabla de votos
  INSERT INTO votos (departamento_id, candidato_id)
  VALUES (p_departamento, p_candidato);
END;
$$;

