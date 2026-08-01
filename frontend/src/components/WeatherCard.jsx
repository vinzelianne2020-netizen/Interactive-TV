import { CloudFog, CloudRain, CloudSnow, CloudSun, SunMedium } from 'lucide-react';

function pickWeatherIcon(code) {
  if (code == null) {
    return CloudSun;
  }

  if (code === 0) {
    return SunMedium;
  }

  if (code >= 51 && code <= 67) {
    return CloudRain;
  }

  if (code >= 71 && code <= 77) {
    return CloudSnow;
  }

  if (code >= 80 && code <= 99) {
    return CloudRain;
  }

  if (code >= 45 && code <= 48) {
    return CloudFog;
  }

  return CloudSun;
}

export function WeatherCard({ weather = {}, onClick }) {
  const Icon = pickWeatherIcon(weather.condition_code);
  const temperature =
    weather.temp_c == null ? '28.2°C' : `${Number(weather.temp_c).toFixed(1)}°C`;

  return (
    <button
      type="button"
      className="metric-card metric-card--weather metric-card--interactive"
      onClick={() => onClick?.()}
    >
      <div className="metric-badge metric-badge--weather">
        <Icon size={22} strokeWidth={2.3} />
      </div>
      <div className="weather-copy">
        <p className="metric-value metric-value--weather">{temperature}</p>
        <p className="metric-label">Current Weather</p>
        <p className="weather-city">{weather.city ?? 'Cebu City, Philippines'}</p>
      </div>
    </button>
  );
}
