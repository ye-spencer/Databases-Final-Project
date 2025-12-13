from bs4 import BeautifulSoup
import re
import repository as repo
import error_log


def reduce_all_whitespace(string : str):
    return " ".join(string.split())

def scrape_individual_performance(eventId : int, season_type : str, season_year : int, gender : str, school_id : str, performance : BeautifulSoup):
    print("------------------Scraping Performance------------------")

    print("Event ID: " + str(eventId))
    print("Season Type: " + season_type)
    print("Season Year: " + str(season_year))
    print("Gender: " + gender)
    print("School ID: " + school_id)
    
    # Get Athlete Name Using data-label "Athlete"
    athlete_link_info = performance.find("div", {"data-label" : "Athlete"}).find("a").get("href").strip()

    assert athlete_link_info.count("/") == 6

    athlete_id = athlete_link_info.split("/")[4]
    assert athlete_link_info.split("/")[5] == school_id

    athlete_full_name = performance.find("div", {"data-label" : "Athlete"}).find("a").text.strip()
    athlete_first_name = athlete_full_name.split(",")[1].strip()
    athlete_last_name = athlete_full_name.split(",")[0].strip()

    print("Athlete ID: " + athlete_id)
    print("Athlete First Name: " + athlete_first_name)
    print("Athlete Last Name: " + athlete_last_name)

    # Get Athlete Year Using data-label "Year"
    athlete_year = performance.find("div", {"data-label" : "Year"}).text.strip()
    
    print("Athlete Year: " + athlete_year)

    # Get Athlete Result Using data-label "Time"
    result_info = performance.find("div", {"data-label" : "Time"})
    if result_info == None:
        result_info = performance.find("div", {"data-label" : "Mark"})
    if result_info == None:
        result_info = performance.find("div", {"data-label" : "Points"})

    result_link_info = result_info.find("a").get("href").strip()
    
    assert result_link_info.count("/") == 7

    meet_id = result_link_info.split("/")[4]
    print("Meet ID: " + meet_id)

    result = result_info.find("a").text.strip()
    print("Result: " + result)

    # Get Meet Info
    meet_link_info = performance.find("div", {"data-label" : "Meet"}).find("a").get("href").strip()
    meet_name = performance.find("div", {"data-label" : "Meet"}).find("a").text.strip()
    print("Meet Name: " + meet_name)

    assert meet_link_info.count("/") == 5
    assert meet_link_info.split("/")[4] == meet_id

    # Get Meet Date
    meet_date = performance.find("div", {"data-label" : "Meet Date"}).text.strip()
    print("Meet Date: " + reduce_all_whitespace(meet_date))

    # Get Wind Info
    wind_info = performance.find("div", {"data-label" : "Wind"})
    if wind_info == None:
        wind_info = ""
    else:
        wind_info = wind_info.text.strip()
    print("Wind Info: " + wind_info)

    repo.insert_athlete(athlete_id, athlete_first_name, athlete_last_name, gender)
    repo.insert_meet(meet_id, meet_name, reduce_all_whitespace(meet_date))
    repo.insert_athlete_performance(
        meet_id, athlete_id, eventId, school_id, result, wind_info,
        season_type, season_year, athlete_year
    )

def scrape_relay_performance(eventId : int, season_type : str, season_year : int, gender : str, school_id : str, performance : BeautifulSoup):
    print("------------------Scraping Relay Performance------------------")

    print("Event ID: " + str(eventId))
    print("Season Type: " + season_type)
    print("Season Year: " + str(season_year))
    print("Gender: " + gender)
    print("School ID: " + school_id)

    # Get Time
    result_info = performance.find("div", {"data-label" : "Time"}).find("a").text.strip()
    print("Result: " + result_info)

    # Get Athletes Info

    athlete_link_info = performance.find("div", {"data-label" : "Athletes"})

    athletes_link_info = athlete_link_info.find_all("a")
    athletes = []
    if len(athletes_link_info) % 4 != 0:
        raise Exception("Invalid Number of Athletes: " + str(len(athletes_link_info)))
    else:
        for athlete_link in athletes_link_info:
            athlete_id = athlete_link.get("href").strip().split("/")[4]
            athletes.append(athlete_id)
            assert athlete_link.get("href").strip().split("/")[5] == school_id

            athlete_last_name = athlete_link.text.strip()
            athlete_full_name = athlete_link.get("href").strip().split("/")[6]
            athlete_first_name = (athlete_full_name[:len(athlete_full_name) - len(athlete_last_name) - 6]).replace("_", " ")

            repo.insert_athlete(athlete_id, athlete_first_name, athlete_last_name, gender)

    athletes = tuple(athletes)
    print("Athletes: " + str(athletes))

    # Get Meet Info
    meet_link_info = performance.find("div", {"data-label" : "Meet"}).find("a").get("href").strip()
    meet_name = performance.find("div", {"data-label" : "Meet"}).find("a").text.strip()
    print("Meet Name: " + reduce_all_whitespace(meet_name))

    assert meet_link_info.count("/") == 5
    meet_id = meet_link_info.split("/")[4]
    print("Meet ID: " + meet_id)

    # Get Meet Date
    meet_date = performance.find("div", {"data-label" : "Meet Date"}).text.strip()
    print("Meet Date: " + meet_date)

    # Get Wind Info
    wind_info = performance.find("div", {"data-label" : "Wind"})
    if wind_info == None:
        wind_info = ""
    else:
        wind_info = wind_info.text.strip()
    print("Wind Info: " + wind_info)

    repo.insert_meet(meet_id, meet_name, reduce_all_whitespace(meet_date))
    repo.insert_relay_team_performance(
        meet_id, athletes, eventId, school_id, result_info, wind_info,
        season_type, season_year
    )
    


def scrape_event(eventId : int, season_type : str, season_year : int, gender : str, school_id : str, soup : BeautifulSoup):
    result = soup.find("div", {"class" : "standard_event_hnd_" + str(eventId)})

    # Get Name Using H3
    name = result.find("h3").text.strip()
    print("Name of Event: " + name)

    # Check if event is relay with is-relay attribute
    is_relay = name.endswith("Relay")
    print("Is Relay: " + str(is_relay))

    repo.insert_event(eventId, name, is_relay)

    # Get Performances Using performance-list-row
    performances = result.find_all("div", {"class" : "performance-list-row"})


    print("Number of Performances: " + str(len(performances)))

    for performance in performances:
        try:
            if is_relay:
                scrape_relay_performance(eventId, season_type, season_year, gender, school_id, performance)
            else:
                scrape_individual_performance(eventId, season_type, season_year, gender, school_id, performance)
        except Exception as e:
            error_log.log_failed(str(e) + "\n" + str(performance) + "\n\n")

def scrape_file(file_content : str, season_type : str, season_year : int, gender : str, school_id : str):

    soup = BeautifulSoup(file_content, "html.parser")
    events = soup.find_all("a", {"id" : re.compile("event")})

    for event in events:
        eventId = int(event.get("name").replace("event", ""))
        print("Event: " + str(eventId))

        scrape_event(eventId, season_type, season_year, gender, school_id, soup)


if __name__ == "__main__":
    with open("pages/2010_Indoor_MD_college_m_Johns_Hopkins.html", "r") as f:
        scrape_file(f.read(), "Indoor", 2010, "m", "Johns_Hopkins")