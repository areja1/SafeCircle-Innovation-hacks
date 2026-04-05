# Integration Guide

## Integration Day Checklist

1. **Vedant** shares Supabase project URL + keys → everyone updates `.env`
2. **Vedant** runs `schema.sql` and `seed.sql` in Supabase SQL editor
3. **Abhinav** starts backend: `uvicorn main:app --reload --port 8000`
4. **Keyur** starts frontend: `npm run dev` (points to `localhost:8000`)
5. **Sumedh** confirms `engine/` functions are importable from `backend/services/`

## Dependency Map

```
frontend  →  backend (HTTP/REST)
backend   →  engine  (Python import)
backend   →  database (Supabase SDK)
backend   →  Claude AI (Anthropic SDK)
```

## Key Integration Points

- `backend/services/risk_service.py` imports from `engine/risk_engine.py`
- `backend/services/crisis_service.py` imports from `engine/crisis_engine.py`
- `backend/services/benefits_service.py` imports from `engine/benefits_eligibility.py`
- Frontend reads Supabase auth token from session and sends as `Authorization: Bearer <token>`
