-- Migration: Add new demand profile types for automatic profile generation
-- These enable the optimizer to generate realistic hourly demand curves
-- based on Italian energy patterns (office, industrial, commercial, residential).

ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'industrial_1shift';
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'industrial_2shift';
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'industrial_3shift';
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'commercial';
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'residential';
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'flat';
