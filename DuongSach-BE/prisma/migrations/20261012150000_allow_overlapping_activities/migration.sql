-- Multiple programs may share a location and time; overlaps are intentional.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_location_no_overlap;
