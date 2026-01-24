
export const FUNNY_ERROR_MESSAGES = [
    "Dra meg nå baklengs... Her ere no muffins!",
    "Ooops! En grevling i taket?",
    "Datamaskinen sier nei.",
    "Vi har mistet en skrue. Eller to.",
    "Doh! Jeg mista en Donut ned i maskineriet.",
    "Her gikk det litt fort i svingene.",
    "Houston, we have a problem.",
    "Kaffepause! Serveren trenger en pust i bakken.",
    "Kem spruta vindusvisker på serveren? Kan du melda deg?",
    "Der seint å stengja Buret, når Fuglen er flogen - Error: Data allereie borte",
    "Gleda gløymest, fyrr du trur, men sorgerna sitja lenge - Kritisk feil oppdaga",
    "Heimen er både vond og god - Serveren er både oppe og nede (mest nede)",
    "Lat det vera Kjerring elder Kall; den klokaste styrer best - Error: Systemet har ikkje visdom",
    "Alt har ein ende, men pølsa har to - Fatal Error på begge endar",
    "Ein kann ikkje alltid spinna Silke - Error 500: Silke utilgjengeleg",
    "404: Humor ikke funnet (men feilen er her).",
    "Noen har snublet i ledningen."
]

export const FUNNY_LOADING_MESSAGES = [
    "Spinner opp hamsterhjulet...",
    "Teller til uendelig (to ganger)...",
    "Leter etter tryllekappen...",
    "Smører tannhjulene...",
    "Laster ned internett...",
    "Til lags åt alle kan ingen gjera - EDB-maskinen prøver sitt beste",
    "Mange Bekkjer smaa gjera ei stor Aa - Laster databitar...",
    "Ein kann ikkje alltid spinna Silke - Serveren gjer det han kan",
    "Enden vert ofte betre enn byrjinga - Buffrar framleis...",
    "Ein ende skal allting hava - Denne lastinga òg, truleg",
    "Det ein sjølv kann gjera, skal ein ikkje bidja andre um - Maskinen jobbar åleine no",
    "Brygger kaffe til serveren..."
]

export const FUNNY_404_MESSAGES = [
    "Denne siden har gått seg vill i skogen.",
    "Vi lette overalt, men fant bare hybelkaniner.",
    "Du har nådd enden av internett.",
    "Her var det tomt. Ekkelt tomt.",
    "Det er ikkje ramn alt som har svarte fjør - 404: Sida du leitar etter er ikkje ramn (finst ikkje)",
    "D'er bedre vera ukjend en illa kjend - 404: Denne sida vel å vera ukjend",
    "For ung er eit godt lyte - 404: Sida er for ung til å eksistere",
    "Der seint å stengja Buret, når Fuglen er flogen - 404: Sida har rømt ut i dataskogen",
    "Gleda gløymest, fyrr du trur - 404: Me gløymde å lage denne sida",
    "Ein ende skal allting hava - 404: Dette var enden (sida finst ikkje)",
    "Noen har brukt svenskeknappen...",
    "404: Siden er på ferie."
]

export function getRandomFunnyError() {
    return FUNNY_ERROR_MESSAGES[Math.floor(Math.random() * FUNNY_ERROR_MESSAGES.length)]
}

export function getRandomFunnyLoading() {
    return FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)]
}

export function getRandomFunny404() {
    return FUNNY_404_MESSAGES[Math.floor(Math.random() * FUNNY_404_MESSAGES.length)]
}
