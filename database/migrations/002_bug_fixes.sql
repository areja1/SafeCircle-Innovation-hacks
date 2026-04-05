-- Migration 002: add columns required to persist dont_sign_warning and group_insights
-- Run in Supabase SQL Editor after 001_initial.sql

ALTER TABLE public.crisis_sessions
    ADD COLUMN IF NOT EXISTS dont_sign_warning TEXT;

ALTER TABLE public.risk_surveys
    ADD COLUMN IF NOT EXISTS group_insights JSONB;
