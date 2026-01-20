-- Migration script to change video_url and result_url columns from VARCHAR(500) to TEXT
-- Run this script to fix the "Data too long for column" error
-- This allows storing longer Runway ML URLs with JWT tokens

USE user_auth;

-- Migrate video_url column in user_videos table
ALTER TABLE user_videos MODIFY COLUMN video_url TEXT NULL;

-- Migrate result_url column in result_links table  
ALTER TABLE result_links MODIFY COLUMN result_url TEXT NOT NULL;
