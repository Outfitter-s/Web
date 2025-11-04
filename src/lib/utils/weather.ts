export async function getWeather(): Promise<
  { temp: string; desc: string; rain: string } | { error: string }
> {
  try {
    const city = await getCity();
    if (typeof city === 'string') {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j2`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP : ${response.status}`);
      }

      const data = await response.json();

      return {
        temp: data.current_condition[0].FeelsLikeC,
        desc: data.current_condition[0].weatherDesc[0].value,
        rain: data.current_condition[0].precipMM,
      };
    } else {
      return { error: 'Impossible de déterminer la ville.' };
    }
  } catch (error) {
    return { error: String(error) };
  }
}

export async function getCity(): Promise<string | { error: string }> {
  const getPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation non disponible'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });

  // 1) Essayer la géolocalisation (si utilisateur autorise)
  try {
    const pos = await getPosition();
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          // Nominatim recommande d'identifier l'application dans l'User-Agent
          'User-Agent': 'OutfitterApp - contact@example.com',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const addr = json.address || {};
        const city = addr.city || addr.town || addr.village || addr.county;
        return city;
      }
    } catch (err) {}
  } catch (err) {}

  // 2) Fallback : requête IP (pas de token nécessaire, attention aux limites)
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) {
      throw new Error(`IP API HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.city;
  } catch (err) {
    return { error: String(err) };
  }
}
