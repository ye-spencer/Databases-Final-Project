import os
import psycopg2
from dotenv import load_dotenv
import datetime
from sklearn.linear_model import LinearRegression

def predict_season(gender : str, seasonType : str, seasonYear : str):

    # Connect to the database
    load_dotenv()
    database_url = os.environ.get("DATABASE_URL")

    if not database_url:
        raise Exception("DATABASE_URL environment variable not set!")

    _connection = psycopg2.connect(database_url)
    _connection.autocommit = True

    cursor = _connection.cursor()

    # Collect all data for the current season, get best performance per meet
    cursor.execute("""
        SELECT 
            E.EventID,
            E.EventName,
            E.EventType,
            A.Gender,
            AtS.SchoolID,
            A.AthleteID,
            A.AthleteFirstName,
            A.AthleteLastName,
            MIN(P.resultvalue) AS resultvalue,
            M.startdate
        FROM Performance AS P
        JOIN CentennialConferenceEvents AS C ON P.eventid = C.eventid
        JOIN AthleteSeason AS AtS ON P.AthleteSeasonID = AtS.AthleteSeasonID
        JOIN Athlete AS A ON AtS.AthleteID = A.AthleteID
        JOIN TrackEvent AS E ON P.EventID = E.EventID
        JOIN TrackMeet AS M ON P.MeetID = M.MeetID
        WHERE AtS.SeasonType = %s
            AND AtS.SeasonYear = %s
            AND A.Gender = %s
            AND (E.EventType = 'sprints' OR E.EventType = 'distance')
            AND C.""" + seasonType + """
        GROUP BY E.EventID, E.EventName, E.EventType, A.Gender, AtS.SchoolID, A.AthleteID, A.AthleteFirstName, A.AthleteLastName, M.startdate
    """, (seasonType, seasonYear, gender))
    all_track_performances = cursor.fetchall()

    cursor.execute("""
    SELECT 
        E.EventID,
        E.EventName,
        E.EventType,
        A.Gender,
        AtS.SchoolID,
        A.AthleteID,
        A.AthleteFirstName,
        A.AthleteLastName,
        MAX(P.resultvalue) AS resultvalue,
        M.startdate
    FROM Performance AS P
    JOIN CentennialConferenceEvents AS C ON P.eventid = C.eventid
    JOIN AthleteSeason AS AtS ON P.AthleteSeasonID = AtS.AthleteSeasonID
    JOIN Athlete AS A ON AtS.AthleteID = A.AthleteID
    JOIN TrackEvent AS E ON P.EventID = E.EventID
    JOIN TrackMeet AS M ON P.MeetID = M.MeetID
    WHERE AtS.SeasonType = %s
        AND AtS.SeasonYear = %s
        AND A.Gender = %s
        AND (E.EventType = 'throws' OR E.EventType = 'jumps' OR E.EventType = 'combined')
        AND C.""" + seasonType + """
    GROUP BY E.EventID, E.EventName, E.EventType, A.Gender, AtS.SchoolID, A.AthleteID, A.AthleteFirstName, A.AthleteLastName, M.startdate
""", (seasonType, seasonYear, gender))
    all_field_performances = cursor.fetchall()

    cursor.execute("""
        SELECT 
            P.EventID,
            TE.EventName,
            TE.Eventtype,
            Ath.Gender AS gender,
            AthS.schoolid,
            AthS.schoolid AS athleteid,
            AthS.schoolid AS athletefirstname,
            ' ' AS athletelastname,
            MIN(P.Resultvalue) AS resultvalue,
            TM.startdate
        FROM Performance AS P
        JOIN CentennialConferenceEvents AS C ON P.eventid = C.eventid
        JOIN RelayTeamMembers AS RTM ON P.RelayTeamID = RTM.RelayTeamID
        JOIN AthleteSeason AthS ON RTM.AthleteSeasonID = AthS.AthleteSeasonID
        JOIN Athlete AS Ath ON AthS.AthleteID = Ath.AthleteID
        JOIN TrackEvent AS TE ON P.EventID = TE.EventID
        JOIN RelayTeam AS RT ON RTM.RelayTeamID = RT.RelayTeamID
        JOIN TrackMeet AS TM ON RT.MeetID = TM.MeetID
        WHERE Ath.Gender = %s
            AND AthS.SeasonYear = %s
            AND AthS.SeasonType = %s
            AND C.""" + seasonType + """
        GROUP BY Ath.gender, P.EventID, TE.EventName, TE.Eventtype, AthS.schoolid, TM.startdate;
    """, (gender, seasonYear, seasonType))
    all_relay_performances = cursor.fetchall()

    all_performances = all_track_performances + all_field_performances + all_relay_performances

    # Group Performances by EventID, AthleteID
    performances_by_event_athlete = {}
    for performance in all_performances:
        event_id = performance[0]
        athlete_id = performance[5]
        if (event_id, athlete_id) not in performances_by_event_athlete:
            performances_by_event_athlete[(event_id, athlete_id)] = []
        performances_by_event_athlete[(event_id, athlete_id)].append(performance)

    
    predictions = []

    # For each event and athlete season: create a linear regression, predict final
    for event_athlete, performances in performances_by_event_athlete.items():
        event_id, athlete_id = event_athlete

        if len(performances) >= 2:
            # Create linear regression
            x = [[float((i[9] - datetime.date(2000, 1, 1)).days)] for i in performances]
            y = [float(i[8]) for i in performances]

            # Create linear regression model
            model = LinearRegression()
            model.fit(x, y)

            # Predict final
            final = model.predict([[sorted(x)[-1][0] + 3]])[0] # Predict result in 3 days

        else:
            final = performances[0][8]

        if final < 0:
            print("Negative final")
            print(event_athlete)
            print(performances)
            print(final)
            continue


        if isinstance(performances[0][5], int):
            predictions.append((event_id, performances[0][1], performances[0][2], performances[0][3], performances[0][4], performances[0][5], performances[0][6], performances[0][7], float(final)))
        else: # For relays
            predictions.append((event_id, performances[0][1], performances[0][2], performances[0][3], performances[0][4], -1, performances[0][6], performances[0][7], float(final)))

    # Upload predictions to new table
    for prediction in predictions:
        cursor.execute("""
            INSERT INTO LinearRegressionPredictions (EventID, EventName, EventType, Gender, SchoolID, AthleteID, AthleteFirstName, AthleteLastName, predictedresult, seasonType, seasonYear)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, prediction + (seasonType, seasonYear))

    _connection.commit()

    cursor.close()
    _connection.close()

if __name__ == "__main__":
    predict_season("M", "Indoor", "2026")
    predict_season("F", "Indoor", "2026")
    predict_season("M", "Outdoor", "2025")
    predict_season("F", "Outdoor", "2025")
    predict_season("M", "Indoor", "2025")
    predict_season("F", "Indoor", "2025")
    predict_season("M", "Outdoor", "2024")
    predict_season("F", "Outdoor", "2024")
    predict_season("M", "Indoor", "2024")
    predict_season("F", "Indoor", "2024")

