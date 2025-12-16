export interface EventPrediction {
    eventid: number;
    eventname: string;
    eventtype: string;
    gender: string;
    predictions: Array<{
        place: number;
        athleteid: number;
        athletefirstname: string;
        athletelastname: string;
        schoolname: string;
        predictedresult: number;
    }>;
}

export interface TeamScore {
    schoolname: string;
    schoolid: string;
    totalscore: number;
    eventbreakdown: Record<string, number>;
}