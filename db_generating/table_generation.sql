-- This is the SQL commands we ran to create the tables on Neon


DROP TABLE IF EXISTS GeographicLocation CASCADE;
CREATE TABLE GeographicLocation (
    LocationID      SERIAL PRIMARY KEY, -- 1, 10,
    CityName        VARCHAR(100) NOT NULL, -- Baltimore, New York
    StateCode       VARCHAR(2) NOT NULL, -- MD, NY
    CountryCode     VARCHAR(2) NOT NULL -- US
);

DROP TABLE IF EXISTS School CASCADE;
CREATE TABLE School (
    SchoolID        VARCHAR(20) PRIMARY KEY, -- Johns_Hopkins, Ursinus
    SchoolName      VARCHAR(100) NOT NULL, -- Johns Hopkins University, Ursinus College
    LocationID      INT NOT NULL REFERENCES GeographicLocation(LocationID), -- 1, 101
    StreetAddress   VARCHAR(100) NOT NULL, -- 3400 North Charles Street, 101 West End Avenue
    EnrollmentSize  INT NOT NULL, -- 10000, 1000
    HasIndoorFacility BOOLEAN NOT NULL -- True, False
);

DROP TABLE IF EXISTS TrackMeet CASCADE;
CREATE TABLE TrackMeet (
    MeetID          INT PRIMARY KEY, -- 1, 101 (TFRRS Meet ID)
    MeetName        VARCHAR(200) NOT NULL, -- Navy Indoor Invitational, Black and Blue Invitational
    StartDate       DATE NOT NULL, -- 2025-12-07, 2025-12-08
    EndDate         DATE NOT NULL -- 2025-12-07, 2025-2026
);

DROP TABLE IF EXISTS Athlete CASCADE;
CREATE TABLE Athlete (
    AthleteID       INT PRIMARY KEY, -- 1, 101 (TFRRS Athlete ID)
    AthleteLastName VARCHAR(100) NOT NULL, -- Ye, Klimov
    AthleteFirstName VARCHAR(100) NOT NULL, -- Spencer, Mirra
    Gender          VARCHAR(1) NOT NULL CHECK (Gender IN ('M', 'F')) -- M, F
);

DROP TABLE IF EXISTS AthleteSeason CASCADE;
CREATE TABLE AthleteSeason (
    AthleteSeasonID SERIAL PRIMARY KEY, -- 1, 101
    AthleteID       INT NOT NULL REFERENCES Athlete(AthleteID), -- 1, 101
    SchoolID        VARCHAR(20) NOT NULL REFERENCES School(SchoolID), -- Johns_Hopkins
    SeasonType      VARCHAR(10) NOT NULL CHECK (SeasonType IN ('Indoor', 'Outdoor')), -- Indoor, Outdoor
    SeasonYear      INT NOT NULL, -- 2025, 2024
    ClassYear       VARCHAR(2) NOT NULL CHECK (ClassYear IN ('FR', 'SO', 'JR', 'SR')), -- FR, SO, JR, SR
    UNIQUE (AthleteID, SeasonType, SeasonYear)
);

DROP TABLE IF EXISTS TrackEvent CASCADE; -- CREATED
CREATE TABLE TrackEvent (
    EventID         INT PRIMARY KEY, -- 1, 101 (TFRRS Event ID)
    EventName       VARCHAR(20) NOT NULL, -- 100m, 4x100m, Discus
    EventType       VARCHAR(8) NOT NULL CHECK (EventType IN ('sprints', 'distance', 'jumps', 'throws', 'combined')), -- sprints, distance, jumps, throws, combined
    MeasureUnit     VARCHAR(7) NOT NULL CHECK (MeasureUnit IN ('seconds', 'meters', 'points')), -- seconds, meters, points
    IsRelay         BOOLEAN NOT NULL -- True, False
);

-- NOTE: Not all relay teams have known team members
DROP TABLE IF EXISTS RelayTeam CASCADE;
CREATE TABLE RelayTeam (
    RelayTeamID     SERIAL PRIMARY KEY, -- 1, 101
    SchoolID        VARCHAR(20) NOT NULL REFERENCES School(SchoolID), -- Johns_Hopkins, Ursinus
    EventID         INT NOT NULL REFERENCES TrackEvent(EventID), -- 1, 101
    MeetID          INT NOT NULL REFERENCES TrackMeet(MeetID) -- 1, 101
);

DROP TABLE IF EXISTS RelayTeamMembers CASCADE;
CREATE TABLE RelayTeamMembers (
    RelayTeamID       INT NOT NULL REFERENCES RelayTeam(RelayTeamID), -- 1, 101
    AthleteSeasonID   INT NOT NULL REFERENCES AthleteSeason(AthleteSeasonID), -- 1, 101
    LegNum            INT NOT NULL CHECK (LegNum IN (1, 2, 3, 4)), -- 1, 2, 3, 4
    PRIMARY KEY (RelayTeamID, AthleteSeasonID)
);

DROP TABLE IF EXISTS Performance CASCADE;
CREATE TABLE Performance (
    PerformanceID    SERIAL PRIMARY KEY, -- 1, 101
    MeetID          INT NOT NULL REFERENCES TrackMeet(MeetID), -- 1, 101
    EventID         INT NOT NULL REFERENCES TrackEvent(EventID), -- 1, 101
    AthleteSeasonID  INT REFERENCES AthleteSeason(AthleteSeasonID), -- 1, 101
    RelayTeamID      INT REFERENCES RelayTeam(RelayTeamID), -- 1, 101
    ResultValue      DECIMAL(8, 2) NOT NULL, -- 8394, 10.12, 1:52.12
    WindGauge        DECIMAL(3, 1), -- 0.0, 2.1
    CHECK ((RelayTeamID IS NULL AND AthleteSeasonID IS NOT NULL) OR (AthleteSeasonID IS NULL AND RelayTeamID IS NOT NULL))
);