DROP TABLE IF EXISTS LinearRegressionPredictions CASCADE;
CREATE TABLE LinearRegressionPredictions (
    EventID         INT NOT NULL REFERENCES TrackEvent(EventID), -- 1, 101 (TFRRS Event ID)
    EventName       VARCHAR(20) NOT NULL, -- 100m, 4x100m, Discus
    EventType       VARCHAR(8) NOT NULL CHECK (EventType IN ('sprints', 'distance', 'jumps', 'throws', 'combined')), -- sprints, distance, jumps, throws, combined
    Gender          VARCHAR(1) NOT NULL CHECK (Gender IN ('M', 'F', 'X')), -- M, F, X
    SchoolID        VARCHAR(20) NOT NULL REFERENCES School(SchoolID), -- Johns_Hopkins
    AthleteID       INT NOT NULL, -- 1, 101
    AthleteFirstName VARCHAR(100) NOT NULL, -- John
    AthleteLastName  VARCHAR(100) NOT NULL, -- Doe
    predictedresult  DECIMAL(8, 2) NOT NULL, -- 8394, 10.12, 1:52.12
    seasonType      VARCHAR(8) NOT NULL CHECK (seasonType IN ('Outdoor', 'Indoor')),
    seasonYear      INT NOT NULL
);