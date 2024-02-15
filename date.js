const Days = {
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    ja: ["日", "月", "火", "水", "木", "金", "土"],
};

const Months = {
    en: [
        "January", "February", "March", "April", "May", "June", "July", "August", "September",
        "October", "November", "December"
    ],
    fr: [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre",
        "Octobre", "Novembre", "Décembre"
    ],
};

function month(lang, i) {
    switch (lang) {
        case "ja": return `${i + 1}月`;
        default: return Months[lang][i];
    }
}

export function date(lang, timestamp) {
    const d = new Date(timestamp);
    switch (lang) {
        case "en":
        case "fr":
            return `${
                Days[lang][d.getDay()]} ${d.getDate()} ${month(lang, d.getMonth())} ${d.getFullYear()
            }`;
        case "ja":
            return `${
                d.getFullYear()}年${month(lang, d.getMonth())}${d.getDate()}日 (${Days[lang][d.getDay()]
            })`;
    }
}

export function timestamp(yyyymmdd) {
    if (yyyymmdd) {
        return new Date(yyyymmdd).valueOf();
    }
}
