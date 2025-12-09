from bs4 import BeautifulSoup
import re
import repository as repo
import error_log

def convert_result_to_decimal(result : str):
    # TODO
    pass

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

    result_decimal = convert_result_to_decimal(result)
    print("Result Decimal: " + str(result_decimal))

    # Get Meet Info

    meet_link_info = performance.find("div", {"data-label" : "Meet"}).find("a").get("href").strip()
    meet_name = performance.find("div", {"data-label" : "Meet"}).find("a").text.strip()
    print("Meet Name: " + meet_name)

    assert meet_link_info.count("/") == 5
    assert meet_link_info.split("/")[4] == meet_id

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

def scrape_relay_performance(eventId : int, season_type : str, season_year : int, gender : str, school_id : str, performance : BeautifulSoup):
    print("------------------Scraping Relay Performance------------------")
    # TODO





def scrape_event(eventId : int, season_type : str, season_year : int, gender : str, school_id : str, soup : BeautifulSoup):
    result = soup.find("div", {"class" : "standard_event_hnd_" + str(eventId)})
    print(result)

    # Get Name Using H3
    name = result.find("h3").text.strip()
    print("Name of Event: " + name)

    repo.insert_event(eventId, name)

    # Get Performances Using performance-list-row
    performances = result.find_all("div", {"class" : "performance-list-row"})


    print("Number of Performances: " + str(len(performances)))

    # Check if event is relay with is-relay attribute
    is_relay = name.endswith("Relay")
    print("Is Relay: " + str(is_relay))

    for performance in performances:
        try:
            if is_relay:
                scrape_relay_performance(eventId, season_type, season_year, gender, school_id, performance)
            else:
                scrape_individual_performance(eventId, season_type, season_year, gender, school_id, performance)
        except Exception as e:
            error_log.log_failed(str(e) + str(performance).encode("utf-8", "ignore").decode("utf-8") + "\n\n")

def scrape_file(file_content : str, season_type : str, season_year : int, gender : str, school_id : str):
    print("Season Type: " + season_type)
    print("Season Year: " + str(season_year))
    print("Gender: " + gender)
    print("School ID: " + school_id)

    soup = BeautifulSoup(file_content, "html.parser")
    events = soup.find_all("a", {"id" : re.compile("event")})

    print("Starting Events:")
    for event in events:
        eventId = int(event.get("name").replace("event", ""))
        print("Event: " + str(eventId))

        scrape_event(eventId, season_type, season_year, gender, school_id, soup)


if __name__ == "__main__":
    with open("pages/2010_Indoor_MD_college_m_Johns_Hopkins.html.html", "r") as f:
        scrape_file(f.read(), "Indoor", 2010, "m", "Johns_Hopkins")