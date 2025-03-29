const dateTime = document.getElementById('date-time');

function updateDateTime() {
    const now = new Date();

    const time = now.toTimeString().split(' ')[0];
    const date = now.toDateString().split('T')[0];
    dateTime.innerHTML=`
    <p><strong>${time.split(':')[0]}:${time.split(':')[1]}</strong></p>
    <p>${date}</p>
    `;

    
}
updateDateTime();
setInterval(updateDateTime(), 100);

let links = JSON.parse(localStorage.getItem('savedLinks')) || [];

function linkFormOpen() {
    const form = document.getElementById('link-form');
    const addButton = document.getElementById('add-link-button');
    form.classList.remove('hidden');
    form.classList.add('link-form');
    addButton.classList.add('hidden');
}

function linkFormClose() {
    const form = document.getElementById('link-form');
    form.classList.remove('link-form');
    form.classList.add('hidden');
    const addButton = document.getElementById('add-link-button');
    addButton.classList.remove('hidden');

    const title = document.getElementById('link-title').value;
    const url = document.getElementById('link-url').value;

    if(title.trim() && url.trim()){
        
        const favicon = `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`;
        //`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
        const newLink = { title, url, favicon };
        links.push(newLink);
    };
    renderLinks();
    console.log(links);
    document.getElementById('link-title').value = '';
    document.getElementById('link-url').value = '';
};

function removeLink(index) {
    links.splice(index, 1);
    console.log(links);
    localStorage.setItem('savedLinks', JSON.stringify(links));
    renderLinks();
}

function renderLinks() {
    const linkList = document.getElementById('links-list');
    linkList.innerHTML='';
    links.forEach((link, index) => {
        const li = document.createElement('li');
        li.innerHTML=`
        <img src="${link.favicon}" alt="${link.title} favicon">
        <a href="${link.url}" target="_blank">${link.title}</a>
        <button class="delete-link" onclick="removeLink(${index})" >x</button>`;
        linkList.appendChild(li);
    });
    document.getElementById('links').appendChild(linkList);
    localStorage.setItem('savedLinks', JSON.stringify(links));
}


async function getLocationName(latitude, longitude) {
    const geoURL = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`;
    try {
        const response = await fetch(geoURL);
        console.log("Nominatim status:", response.status, response.statusText);
        if(!response.ok) throw new Error("Could not retrieve location name");
        const data = await response.json();
        return data.display_name.split(',')[0] || "Unknown location"
    } catch (error) {
        return "Unknown location";
    }
}
async function getLocation() {
    return new Promise ( (resolve) => {
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    resolve([ 59.3293, 18.0686 ]);
                }
            );
        }
        else {
            resolve([ 59.3293, 18.0686 ]);
        }

    }
    )
}

renderLinks();
function getWeatherDescription(weatherCode) {
    switch (weatherCode) {
        case 0: return ['Klart väder', '<i class="fa-solid fa-sun"></i>']; // Sol
        case 1: return ['Mestadels klart', '<i class="fa-solid fa-cloud-sun"></i>']; // Lite moln och sol
        case 2: return ['Delvis molnigt', '<i class="fa-solid fa-cloud-sun"></i>']; // Moln och sol
        case 3: return ['Mulet', '<i class="fa-solid fa-cloud"></i>']; // Moln
        case 51: case 53: case 55: return ['Duggregn', '<i class="fa-solid fa-cloud-showers-heavy"></i>']; // Lätt regn
        case 61: case 63: case 65: return ['Regn', '<i class="fa-solid fa-cloud-rain"></i>']; // Regn
        case 71: case 73: case 75: return ['Snö', '<i class="fa-solid fa-snowflake"></i>']; // Snö
        case 95: return ['Åska', '<i class="fa-solid fa-bolt"></i>']; // Åskblixt
        default: return ['Okänt väder', '<i class="fa-solid fa-question"></i>']; // Frågetecken
      }
  }

async function fetchWeather() {
    const thisLocation = await getLocation(); 
    const [latitude, longitude] = thisLocation;
    const locationName = await getLocationName(latitude, longitude);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode&timezone=Europe/Stockholm`;
    //const weatherURL = 'https://api.open-meteo.com/v1/forecast?latitude=59.3293&longitude=18.0686&current_weather=true&hourly=temperature_2m,weathercode&timezone=Europe/Stockholm';
    await fetch(weatherURL)
        .then(response => response.json())
        .then(data => {
            const tempToday = data.current_weather.temperature;
            const tomorrowIndex = data.hourly.time.findIndex(time => 
                time.startsWith(tomorrow.toISOString().split('T')[0]) && 
                time.endsWith('12:00')
                );
            const dayATIndex = data.hourly.time.findIndex(time => 
                time.startsWith(dayAfterTomorrow.toISOString().split('T')[0]) && 
                time.endsWith('12:00')
                );    
            
            const weatherDIV = document.getElementById('board2');
            weatherDIV.innerHTML = `
            <div class="weather-head">
            <h3>Dagens väder</h3>
            <p class="location-name"><i class="fa-solid fa-location-dot"></i> ${locationName}</p>
            </div>
            <div class="weather-content">
            ${getWeatherDescription(data.current_weather.weathercode)[1]}
            <div class="weather-text">
                <h3>Idag</h3> 
                <div class="weather-info">
                    <p>${tempToday} &degC</p> 
                    <p>${getWeatherDescription(data.current_weather.weathercode)[0]}</p></div>  
                </div>
            </div>

            <div class="weather-content">
            ${getWeatherDescription(data.hourly.weathercode[tomorrowIndex])[1]}
                <div class="weather-text">
                    <h3>Imorgon</h3> 
                    <div class="weather-info">
                        <p> ${data.hourly.temperature_2m[tomorrowIndex]} &degC</p> 
                        <p>${getWeatherDescription(data.hourly.weathercode[tomorrowIndex])[0]}</p>
                    </div>
                </div>
            </div>
            
            <div class="weather-content"><p>
            ${getWeatherDescription(data.hourly.weathercode[dayATIndex])[1]}</p>
                <div class="weather-text">
                    <h3>${dayAfterTomorrow.toLocaleDateString('sv-SE', { weekday: 'long' })}</h3> 
                    <div class="weather-info">
                        <p> ${data.hourly.temperature_2m[dayATIndex]} &degC</p>
                        <p>${getWeatherDescription(data.hourly.weathercode[dayATIndex])[0]}</p>
                    </div>
                </div>
            </div>
            `;
        });
    
}

fetchWeather();



async function getMarketValues() {
    console.log("bitcoin");
    const btcResponse = await fetch('https://blockchain.info/ticker');
    const btcData = await btcResponse.json();
    console.log("btc now", btcData);
    const btcSEK = btcData.SEK.last;
    const dollarSEK = btcSEK/btcData.USD.last
    const euroSEK = btcSEK/btcData.EUR.last

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const day = String(yesterday.getDate()).padStart(2, '0');
    const month = String(yesterday.getMonth() + 1).padStart(2, '0'); // +1 eftersom månader är 0-baserade
    const year = yesterday.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const pastResponse = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr}`);
    if (pastResponse.status === 429) {
        console.log('Too Many Requests från CoinGecko, väntar 10 sekunder...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // Vänta 10 sekunder
        const retryResponse = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${dateStr}`);
        if (!retryResponse.ok) throw new Error('Misslyckades efter retry');
        var pastData = await retryResponse.json();
      } else if (!pastResponse.ok) {
        throw new Error(`CoinGecko fel: ${pastResponse.status}`);
      } else {
        var pastData = await pastResponse.json();
      }
    const pastBtcSEK = pastData.market_data.current_price.sek;
    const pastBtcUSD = pastData.market_data.current_price.sek/pastData.market_data.current_price.usd;
    const pastBtcEUR = pastData.market_data.current_price.sek/pastData.market_data.current_price.eur;
    console.log("btc past", pastData);
    const changeBTC = ((btcSEK-pastBtcSEK)/pastBtcSEK *100).toFixed(2);
    const changeUSD = ((dollarSEK-pastBtcUSD)/pastBtcUSD*100).toFixed(2);
    const changeEUR = ((euroSEK-pastBtcEUR)/pastBtcEUR*100).toFixed(2);
    
    const priceDiv = document.getElementById('board3');
    priceDiv.innerHTML=`
    <h3>Valutakurs</h3>
    <div class="price-index">
        <i class="fa-brands fa-bitcoin"></i>
        <div class="price-index-content">
            <div class="price">
                <p>${btcSEK.toFixed(2)} SEK</p>
            </div>
            <div class="change ${changeBTC>0 ? "positive" : "negative"}">
                <p class="percent">${changeBTC}%</p>
            </div>
        </div>
    </div>

    <div class="price-index">
        <i class="fa-solid fa-dollar-sign"></i>
        <div class="price-index-content">
            <div class="price">
                <p>${dollarSEK.toFixed(2)} SEK</p>
            </div>
            <div class="change ${changeUSD>0 ? "positive" : "negative"}">
                <p class="percent">${changeUSD}%</p>
            </div>
        </div>
    </div>

    <div class="price-index">
        <i class="fa-solid fa-euro-sign"></i>
        <div class="price-index-content">
            <div class="price">
                <p>${euroSEK.toFixed(2)} SEK</p>
            </div>
            <div class="change ${changeEUR>0 ? "positive" : "negative"}">
                <p class="percent">${changeEUR}%</p>
            </div>
        </div>
    </div>
    </div>
    `;
}

getMarketValues();

const textarea = document.getElementById('notes');

window.onload = function() {
    getBackgroundImage();
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        textarea.value = savedNotes;
    }
};

textarea.addEventListener('input', function() {
    localStorage.setItem('notes', this.value);
});

async function getBackgroundImage() {
    const accessKey = 'mFYzfnitE8g3uH_Um_aGUSSFnqzH9_9o6YCorMJDsGo';
    const bgImage = await fetch('https://api.unsplash.com/photos/random', {
        headers: {
            'Authorization': `Client-ID ${accessKey}`
        }
    });
    const newImg = await bgImage.json();
    console.log("new image", newImg)
    const imgUrl = newImg.urls.regular;
    
    console.log("load image", imgUrl);
    const contentBackground = document.getElementById('content-background');
    contentBackground.style.backgroundImage = `url(${imgUrl})`;
}

const newBackground = document.getElementById('new-image-button');

newBackground.addEventListener('click', getBackgroundImage);