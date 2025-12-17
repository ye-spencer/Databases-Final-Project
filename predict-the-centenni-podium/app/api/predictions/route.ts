import { query } from "@/app/lib/db";
import { EventPrediction, TeamScore } from "@/app/lib/types";
import { NextRequest, NextResponse } from "next/server";


interface IndividualEventPrediction {
    eventid: number;
    eventname: string;
    eventtype: string;
    gender: string;
    schoolid: string;
    athleteid: number;
    athletefirstname: string;
    athletelastname: string;
    predictedresult: number;
}

interface AthletePrediction {
    place: number;
    athleteid: number;
    athletefirstname: string;
    athletelastname: string;
    schoolid: string;
    schoolname: string;
    predictedresult: number;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const model = searchParams.get('model');
    const season = searchParams.get('season');
    const gender = searchParams.get('gender');

    if (!model || !season || !gender) {
        return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const [year, seasonType] = season.split("-");


    let modelLower = model.toLowerCase();

    let individualPredictions: IndividualEventPrediction[];

    if (modelLower === "season-best") {
        individualPredictions = await getSeasonBestPredictions(gender, seasonType, year);
    }
    else if (modelLower === "linear-regression") {
        individualPredictions = await getLinearRegressionPredictions(gender, seasonType, year);
    }
    else {
        return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    const schoolRows = await query<{ schoolid: string }>('SELECT schoolid FROM school');
    const schools = schoolRows.map(s => s.schoolid);

    const eventPredictions = convertIndividualToPredictions(individualPredictions);

    const teamScores = calculateTeamScore(eventPredictions, schools);

    return NextResponse.json({ eventPredictions, teamScores });
}

function calculateTeamScore(predictions: EventPrediction[], schools: string[]): TeamScore[] {
    const teamScores: Record<string, TeamScore> = {};

    for (const school of schools) {
        teamScores[school] = {
            schoolid: school,
            schoolname: school,
            totalscore: 0,
            eventbreakdown: {}
        };
    }

    predictions.forEach((event: EventPrediction) => {
        event.predictions.forEach((athlete: AthletePrediction) => {
            let score = 0;
            if (athlete.place === 1) {
                score = 10;
            }
            else if (athlete.place === 2) {
                score = 8;
            }
            else if (athlete.place === 3) {
                score = 6;
            }
            else if (athlete.place === 4) {
                score = 5;
            }
            else if (athlete.place === 5) {
                score = 4;
            }
            else if (athlete.place === 6) {
                score = 3;
            }
            else if (athlete.place === 7) {
                score = 2;
            }
            else if (athlete.place === 8) {
                score = 1;
            }
            teamScores[athlete.schoolid].totalscore += score;
            teamScores[athlete.schoolid].eventbreakdown[event.eventname] = score;
        });
    });

    return Object.values(teamScores);
}

function convertIndividualToPredictions(individualPredictions: IndividualEventPrediction[]): EventPrediction[] {
    const eventRecords: Record<string, IndividualEventPrediction[]> = {};

    individualPredictions.forEach((record: IndividualEventPrediction) => {
        if (!eventRecords[record.eventid]) {
            eventRecords[record.eventid] = [];
        }
        eventRecords[record.eventid].push(record);
    });

    // For each event, sort by predictedresult, asc for jumps and throws, desc for sprints and distance
    Object.entries(eventRecords).forEach(([eventid, records]) => {
        eventRecords[eventid] = records.sort((a, b) => {
            if (a.eventtype === 'jumps' || a.eventtype === 'throws' || a.eventtype === 'combined') {
                return b.predictedresult - a.predictedresult;
            }
            else {
                return a.predictedresult - b.predictedresult;
            }
        });
    });

    const predictions: EventPrediction[] = [];

    // For each event, create an EventPrediction object
    Object.entries(eventRecords).forEach(([eventid, records]) => {
        const eventPrediction: EventPrediction = {
            eventid: parseInt(eventid),
            eventname: records[0].eventname,
            eventtype: records[0].eventtype,
            gender: records[0].gender,
            predictions: records.map((record, index) => ({
                place: index + 1,
                athleteid: record.athleteid,
                athletefirstname: record.athletefirstname,
                athletelastname: record.athletelastname,
                schoolid: record.schoolid,
                schoolname: record.schoolid, // Note: This is using schoolid as schoolname for now
                predictedresult: record.predictedresult,
            }))
        };
        predictions.push(eventPrediction);
    });

    return predictions
}

// Note: Delete when done
function getUnimplementedRandomData(gender: string, seasonType: string, seasonYear: string): IndividualEventPrediction[] {

    const predictions: IndividualEventPrediction[] = [
        {
            eventid: 1,
            eventname: "100m Dash",
            eventtype: "sprints",
            gender: gender,
            schoolid: "Ursinus",
            athleteid: 100,
            athletefirstname: "John",
            athletelastname: "Doe",
            predictedresult: 10.76
        },
        {
            eventid: 1,
            eventname: "100m Dash",
            eventtype: "sprints",
            gender: gender,
            schoolid: "Ursinus",
            athleteid: 101,
            athletefirstname: "Steven",
            athletelastname: "Wang",
            predictedresult: 10.45
        },
        {
            eventid: 1,
            eventname: "100m Dash",
            eventtype: "sprints",
            gender: gender,
            schoolid: "Johns_Hopkins",
            athleteid: 102,
            athletefirstname: "Mike",
            athletelastname: "Shlong",
            predictedresult: 10.99
        },
        {
            eventid: 1,
            eventname: "100m Dash",
            eventtype: "sprints",
            gender: gender,
            schoolid: "McDaniel",
            athleteid: 103,
            athletefirstname: "Dong",
            athletelastname: "Xiya",
            predictedresult: 10.99
        },
        {
            eventid: 3,
            eventname: "High Jump",
            eventtype: "jumps",
            gender: gender,
            schoolid: "McDaniel",
            athleteid: 102,
            athletefirstname: "Mike",
            athletelastname: "Shlong",
            predictedresult: 2.00
        },
        {
            eventid: 3,
            eventname: "High Jump",
            eventtype: "jumps",
            gender: gender,
            schoolid: "Johns_Hopkins",
            athleteid: 105,
            athletefirstname: "Jesus",
            athletelastname: "Christ",
            predictedresult: 2.05
        }
    ];

    return predictions;
}

async function getSeasonBestPredictions(gender: string, seasonType: string, seasonYear: string): Promise<IndividualEventPrediction[]> {

    try {
        const [
            trackSeasonRecords,
            fieldSeasonRecords
        ] = await Promise.all([
            query<IndividualEventPrediction>(
                `
                SELECT 
                    P.EventID,
                    TE.EventName,
                    TE.Eventtype,
                    Ath.gender,
                    P.AthleteSeasonID,
                    A.schoolid,
                    Ath.athletefirstname,
                    Ath.athletelastname,
                    Ath.athleteid,
                    MIN(P.Resultvalue) AS predictedresult
                FROM Performance AS P
                JOIN CentennialConferenceEvents AS CCE ON P.EventID = CCE.EventID
                JOIN AthleteSeason AS A ON P.AthleteSeasonID = A.AthleteSeasonID
                JOIN Athlete AS Ath ON A.AthleteID = Ath.AthleteID
                JOIN TrackEvent AS TE ON P.EventID = TE.EventID
                WHERE Ath.Gender = '${gender}'
                    AND A.SeasonYear = '${seasonYear}'
                    AND A.SeasonType = '${seasonType}'
                    AND (TE.Eventtype = 'sprints' OR TE.Eventtype = 'distance')
                GROUP BY P.EventID, TE.EventName, TE.Eventtype, Ath.gender, P.AthleteSeasonID, A.schoolid, Ath.athletefirstname, Ath.athletelastname, Ath.athleteid
                `),
            query<IndividualEventPrediction>(
                `
                SELECT 
                    P.EventID,
                    TE.EventName,
                    TE.Eventtype,
                    Ath.gender,
                    P.AthleteSeasonID,
                    A.schoolid,
                    Ath.athletefirstname,
                    Ath.athletelastname,
                    Ath.athleteid,
                    MAX(P.Resultvalue) AS predictedresult
                FROM Performance AS P
                JOIN CentennialConferenceEvents AS CCE ON P.EventID = CCE.EventID
                JOIN AthleteSeason AS A ON P.AthleteSeasonID = A.AthleteSeasonID
                JOIN Athlete AS Ath ON A.AthleteID = Ath.AthleteID
                JOIN TrackEvent AS TE ON P.EventID = TE.EventID
                WHERE Ath.Gender = '${gender}'
                    AND A.SeasonYear = '${seasonYear}'
                    AND A.SeasonType = '${seasonType}'
                    AND (TE.Eventtype = 'jumps' OR TE.Eventtype = 'throws')
                GROUP BY P.EventID, TE.EventName, TE.Eventtype, Ath.gender, P.AthleteSeasonID, A.schoolid, Ath.athletefirstname, Ath.athletelastname, Ath.athleteid
                `),
        ]);

        return [...trackSeasonRecords, ...fieldSeasonRecords]

    } catch (error) {
        console.error('Error fetching season best predictions:', error);
        return [];
    }
}

async function getLinearRegressionPredictions(gender: string, seasonType: string, seasonYear: string): Promise<IndividualEventPrediction[]> {
    return getUnimplementedRandomData(gender, seasonType, seasonYear);
}
