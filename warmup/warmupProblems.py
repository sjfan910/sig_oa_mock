import math
import requests

BASE_URL = "https://ghibliapi.vercel.app"


# ---------------- Functions and Expressions ----------------

def techLibs():
    name = input("Enter your name: ")
    friendName = input("Enter your best friend's name: ")
    studySpot = input("Enter your favorite study spot: ")
    print(f"The other day, I saw {name} and {friendName} up to no good.")
    print(f"They were loudly gossiping at {studySpot} instead of studying.")


def diningDollars():
    current = float(input("How many dining dollars do you currently have? "))
    weekly = float(input("How many dining dollars do you spend per week? "))
    weeks = float(input("How many weeks are left? "))
    leftOver = round(current - weekly * weeks, 2)
    print(f"You will have ${leftOver:.2f} left over.")


def sphereVol():
    r = float(input("Enter the radius of your sphere: "))
    volume = round((3.14) * (r ** 3) * (4 / 3), 2)
    print(f"The volume of your sphere is {volume}.")


# ---------------- Conditionals ----------------

def italianNight(cookTime):
    if cookTime >= 50:
        return "Lasagna"
    elif cookTime >= 35:
        return "Pasta"
    elif cookTime >= 20:
        return "Breadsticks"
    return "We'll cook some other time."


def toCook(numClasses, diningDollars):
    if numClasses > 3 and diningDollars > 10:
        print("Let's get Panda Express!")
    elif numClasses <= 3 and diningDollars >= 50:
        print("Let's splurge on Chick-fil-A!")
    else:
        print("Guess I'll have to cook myself.")


def cookingClass(date, isWeekend):
    isEven = date % 2 == 0
    if isWeekend:
        return "Yes" if isEven else "Unsure"
    return "No" if isEven else "Yes"


# ---------------- Iteration ----------------

def captureTheFlag(directions):
    for d in directions[::-1]:
        if d == "L":
            print("Turn left!")
        elif d == "R":
            print("Turn right!")


def demystifyMessage(jumbledMessage):
    result = ""
    for ch in jumbledMessage:
        if ch.isalpha():
            result += ch
    return result


def gnomeAccounting(orderNumbers):
    for i in range(0, len(orderNumbers), 6):
        print(orderNumbers[i:i + 6])


# ---------------- Strings and Lists ----------------

def countCase(loveLetter):
    upper = 0
    lower = 0
    for ch in loveLetter:
        if ch.isupper():
            upper += 1
        elif ch.islower():
            lower += 1
    if upper > lower:
        return f"{upper - lower} more uppercase letter(s)."
    elif lower > upper:
        return f"{lower - upper} more lowercase letter(s)."
    return "Perfectly balanced!"


def findLove(candidates, favCity):
    matches = []
    for name, city in candidates:
        if city == favCity:
            matches.append(name)
    return sorted(matches)


def mutualInterests(yourInterests, theirInterests):
    interests = []
    for interest in yourInterests:
        if interest in theirInterests and interest not in interests:
            interests.append(interest)
    return sorted(interests)


# ---------------- Tuples and Modules ----------------

def numInventions(inventions):
    completed = 0
    for name, done in inventions:
        if done:
            completed += 1
    return completed


def helpPhineas(badge, badges):
    for name, count in badges:
        if name == badge:
            return 1 <= count <= 8
    return False


def agentDispatch(coordinates, agents):
    closest = None
    closestDist = None
    for name, location in agents:
        d = math.dist(coordinates, location)
        if closestDist is None or d < closestDist:
            closest = name
            closestDist = d
    return closest


# ---------------- Dictionaries ----------------

def bestCity(voteDict):
    best = None
    for city in voteDict:
        if best is None or len(voteDict[city]) > len(voteDict[best]):
            best = city
    return best


def winningTeam(raceWinners):
    winners = []
    for team, (driver, points) in raceWinners.items():
        if points >= 25:
            winners.append(team)
    return sorted(winners)


def fantasyF1(driverCatalog, myPicks):
    cost = 0
    for team in driverCatalog:
        for driver, price in driverCatalog[team].items():
            if driver in myPicks:
                cost += price
    return cost


# ---------------- File I/O ----------------

def _readFlights():
    """Return a list of (route, emissions) tuples from swiftieFlights.txt."""
    with open("swiftieFlights.txt", "r") as f:
        lines = [line.strip() for line in f.readlines()]
    flights = []
    for i, line in enumerate(lines):
        if " to " in line:
            emissions = float(lines[i + 4].split()[0])
            flights.append((line, emissions))
    return flights


def taylorEmissions(route):
    for r, emissions in _readFlights():
        if r == route:
            return emissions


def taylorFlights(carbonTons):
    flights = []
    for route, emissions in _readFlights():
        if emissions > carbonTons:
            flights.append(route)
    return sorted(flights)


def transportationModes(cityTransport):
    lines = ["Transportation Modes", ""]
    for mode, carbon in cityTransport:
        lines.append(f"{mode}: {carbon}")
    with open("transportationModes.txt", "w") as f:
        f.write("\n".join(lines))


# ---------------- APIs ----------------

def letterLover(name):
    films = requests.get(f"{BASE_URL}/films").json()
    movieList = []
    for film in films:
        if film["title"].lower().startswith(name.lower()):
            movieList.append(film["title"])
    return sorted(movieList)


def speciesFinder(eyeColor):
    species = requests.get(f"{BASE_URL}/species").json()
    for s in species:
        colors = [c.strip().lower() for c in s["eye_colors"].split(",")]
        if eyeColor.lower() in colors:
            return True
    return False


def characters(filmName):
    films = requests.get(f"{BASE_URL}/films").json()
    charList = []
    for film in films:
        if film["title"] == filmName:
            for url in film["people"]:
                if url.rstrip("/").endswith("/people"):
                    continue
                person = requests.get(url).json()
                if person:
                    charList.append(person["name"])
    return sorted(charList)


# ---------------- Recursion ----------------

def foulCount(teamList):
    if not teamList:
        return 0
    return teamList[0][1] + foulCount(teamList[1:])


def convertTeams(teamsTup):
    if not teamsTup:
        return []
    first = [teamsTup[0]] if isinstance(teamsTup[0], str) else []
    return first + convertTeams(teamsTup[1:])


def mergeTeamNames(team1, team2):
    if not team1:
        return team2
    if not team2:
        return team1
    return team1[0] + team2[0] + mergeTeamNames(team1[1:], team2[1:])


# ---------------- Object Oriented Programming ----------------

class Spiderman:
    def __init__(self, name, health, damage):
        self.name = name
        self.health = health
        self.damage = damage

    def webStrike(self, villain):
        villain.health -= self.damage
        if villain.health <= 0:
            villain.isDefeated = True
            print(f"{villain.name} has been defeated!")

    def __gt__(self, other):
        return self.health > other.health


class Villain:
    def __init__(self, name, health, damage):
        self.name = name
        self.health = health
        self.damage = damage
        self.isDefeated = False

    def attack(self, spiderman):
        if self.isDefeated:
            print(f"{self.name} is already defeated!")
            return
        spiderman.health -= self.damage

    def __str__(self):
        return f"{self.name} has {self.health} health and {self.damage} damage."


class Universe:
    def __init__(self, name):
        self.name = name
        self.spiderList = []
        self.villainList = []

    def transportSpiderman(self, spiderman):
        self.spiderList.append(spiderman.name)
        self.spiderList.sort()

    def transportVillain(self, villain):
        self.villainList.append(villain.name)
        self.villainList.sort()

    def battle(self, spiderman, villain):
        found = True
        if spiderman.name not in self.spiderList:
            print(f"{spiderman.name} not found.")
            found = False
        if villain.name not in self.villainList:
            print(f"{villain.name} not found.")
            found = False
        if not found:
            return
        while spiderman.health > 0 and villain.health > 0:
            spiderman.webStrike(villain)
            villain.attack(spiderman)
        if spiderman.health <= 0:
            print(f"{spiderman.name} lost the battle!")
        elif villain.health <= 0:
            print(f"{villain.name} lost the battle!")
