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
        console.log("Season Best");
        individualPredictions = await getSeasonBestPredictions(gender, seasonType, year);
    }
    else if (modelLower === "linear-regression") {
        console.log("Linear Regression");
        individualPredictions = await getLinearRegressionPredictions(gender, seasonType, year);
    }
    else {
        return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }
    console.log(individualPredictions);


    const eventPredictions = convertIndividualToPredictions(individualPredictions);

    const teamScores = calculateTeamScore(eventPredictions);

    return NextResponse.json({ eventPredictions, teamScores });
}

function calculateTeamScore(predictions: EventPrediction[]): TeamScore[] {
    // TODO

    // Dictionary of schoolid -> score & event-score

    // For each event, for the top 8 scores, give relevent points and sum per school (perhaps already create one for each school)

    // Add score and breakdown for each school (include event record)

    return [];
}

function convertIndividualToPredictions(individualPredictions: IndividualEventPrediction[]): EventPrediction[] {
    const eventRecords: Record<string, IndividualEventPrediction[]> = {};

    console.log("REACHED1")

    individualPredictions.forEach((record: IndividualEventPrediction) => {
        if (!eventRecords[record.eventid]) {
            eventRecords[record.eventid] = [];
        }
        eventRecords[record.eventid].push(record);
    });

    console.log("REACHED2")

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

    console.log("REACHED3")

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

    console.log("REACHED4")

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
            schoolid: "Sample_College",
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
            schoolid: "Sample_College",
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
            schoolid: "Fake_University",
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
            schoolid: "Test_State",
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
            schoolid: "Test_State",
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
            schoolid: "Fake_University",
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

        console.log(trackSeasonRecords, fieldSeasonRecords);

        return [...trackSeasonRecords, ...fieldSeasonRecords]

    } catch (error) {
        console.error('Error fetching season best predictions:', error);
        return [];
    }
}

async function getLinearRegressionPredictions(gender: string, seasonType: string, seasonYear: string): Promise<IndividualEventPrediction[]> {
    return getUnimplementedRandomData(gender, seasonType, seasonYear);
}
