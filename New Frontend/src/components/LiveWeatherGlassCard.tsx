import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LocateFixed } from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { APPLE_SPRING } from '@/lib/motion';

interface CityPreset {
  name: string;
  lat: number;
  lon: number;
  fallbackTempC: number;
  fallbackWindKmh: number;
  fallbackPrecipPct: number;
  fallbackHumidityPct: number;
  fallbackCondition: string;
}

const CITY_PRESETS: CityPreset[] = [
  {
    name: 'Toronto',
    lat: 43.6532,
    lon: -79.3832,
    fallbackTempC: 21,
    fallbackWindKmh: 4,
    fallbackPrecipPct: 45,
    fallbackHumidityPct: 56,
    fallbackCondition: 'Mostly Cloudy',
  },
  {
    name: 'New York',
    lat: 40.7128,
    lon: -74.006,
    fallbackTempC: 23,
    fallbackWindKmh: 9,
    fallbackPrecipPct: 20,
    fallbackHumidityPct: 52,
    fallbackCondition: 'Partly Cloudy',
  },
  {
    name: 'London',
    lat: 51.5072,
    lon: -0.1276,
    fallbackTempC: 18,
    fallbackWindKmh: 11,
    fallbackPrecipPct: 60,
    fallbackHumidityPct: 68,
    fallbackCondition: 'Scattered Clouds',
  },
  {
    name: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    fallbackTempC: 24,
    fallbackWindKmh: 7,
    fallbackPrecipPct: 15,
    fallbackHumidityPct: 49,
    fallbackCondition: 'Clear & Mild',
  },
];

interface DailyForecastRow {
  dayLabel: string;
  maxC: number;
  minC: number;
  precipPct: number;
}

interface WeatherSnapshot {
  city: string;
  tempC: number;
  condition: string;
  windKmh: number;
  precipPct: number;
  humidityPct: number;
  weatherCode: number;
  daily: DailyForecastRow[];
}

function decodeWmoCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Mostly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Atmospheric Mist';
  if (code >= 51 && code <= 67) return 'Light Rain';
  if (code >= 71 && code <= 77) return 'Snow Flurries';
  if (code >= 80 && code <= 82) return 'Passing Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Mostly Cloudy';
}

const DEFAULT_DAILY: DailyForecastRow[] = [
  { dayLabel: 'Thu', maxC: 22, minC: 15, precipPct: 30 },
  { dayLabel: 'Fri', maxC: 24, minC: 16, precipPct: 15 },
  { dayLabel: 'Sat', maxC: 21, minC: 14, precipPct: 45 },
  { dayLabel: 'Sun', maxC: 23, minC: 15, precipPct: 10 },
];

/**
 * Tactile 3D stippled-grain Sun & Overlapping Clouds SVG matching the attached Toronto Weather card
 */
function FrostedSunCloudArtwork() {
  return (
    <svg
      viewBox="0 0 200 135"
      fill="none"
      className="mx-auto h-28 w-40 drop-shadow-[0_14px_24px_rgba(0,0,0,0.22)] select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sunSphere" x1="112" y1="18" x2="162" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="rearCloudGrad" x1="65" y1="30" x2="155" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="52%" stopColor="#FDE68A" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="frontCloudGrad" x1="42" y1="58" x2="122" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <filter id="frostedCloudGrain" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.09 0"
            in="noise"
            result="softNoise"
          />
          <feComposite in="softNoise" in2="SourceGraphic" operator="in" result="maskedNoise" />
          <feBlend mode="overlay" in="SourceGraphic" in2="maskedNoise" />
        </filter>
      </defs>

      {/* Warm Sun Sphere on Upper Right */}
      <circle cx="136" cy="46" r="27" fill="url(#sunSphere)" />

      {/* Rear Sun-Lit Cumulus Cloud */}
      <path
        filter="url(#frostedCloudGrain)"
        d="M66 96H142C154.7 96 165 85.7 165 73C165 61.2 156.1 51.5 144.6 50.2C140.4 36.2 127.4 26 112 26C93.8 26 78.9 40.3 78.1 58.3C67.4 60.2 59.2 69.5 59.2 80.8C59.2 89.2 62.2 96 66 96Z"
        fill="url(#rearCloudGrad)"
      />

      {/* Foreground Tactile Frosted Cloud */}
      <path
        filter="url(#frostedCloudGrain)"
        d="M52 112H112C121.9 112 130 103.9 130 94C130 84.8 123.1 77.2 114.1 76.1C110.8 65.2 100.7 57.2 88.6 57.2C74.4 57.2 62.8 68.3 62.1 82.4C53.7 83.9 47.4 91.2 47.4 100C47.4 106.6 49.4 112 52 112Z"
        fill="url(#frontCloudGrad)"
      />
    </svg>
  );
}

export function LiveWeatherGlassCard() {
  const [cityIndex, setCityIndex] = useState(0);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [showForecast, setShowForecast] = useState(false);
  const [locating, setLocating] = useState(false);

  const initialPreset = CITY_PRESETS[0];
  const [weather, setWeather] = useState<WeatherSnapshot>({
    city: initialPreset.name,
    tempC: initialPreset.fallbackTempC,
    condition: initialPreset.fallbackCondition,
    windKmh: initialPreset.fallbackWindKmh,
    precipPct: initialPreset.fallbackPrecipPct,
    humidityPct: initialPreset.fallbackHumidityPct,
    weatherCode: 2,
    daily: DEFAULT_DAILY,
  });

  const fetchCityWeather = useCallback(async (lat: number, lon: number, label: string, preset?: CityPreset) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();

      const dailyTimes: string[] = data?.daily?.time ?? [];
      const dailyMax: number[] = data?.daily?.temperature_2m_max ?? [];
      const dailyMin: number[] = data?.daily?.temperature_2m_min ?? [];
      const dailyPrecip: number[] = data?.daily?.precipitation_probability_max ?? [];

      const parsedDaily: DailyForecastRow[] = dailyTimes.slice(1, 5).map((iso, i) => {
        const d = new Date(`${iso}T12:00:00`);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          dayLabel,
          maxC: Math.round(dailyMax[i + 1] ?? 21),
          minC: Math.round(dailyMin[i + 1] ?? 14),
          precipPct: Math.round(dailyPrecip[i + 1] ?? 25),
        };
      });

      setWeather({
        city: label,
        tempC: Math.round(data?.current?.temperature_2m ?? preset?.fallbackTempC ?? 21),
        condition: decodeWmoCondition(Number(data?.current?.weather_code ?? 2)),
        windKmh: Math.max(1, Math.round(data?.current?.wind_speed_10m ?? preset?.fallbackWindKmh ?? 4)),
        precipPct: Math.round(dailyPrecip[0] ?? preset?.fallbackPrecipPct ?? 45),
        humidityPct: Math.round(data?.current?.relative_humidity_2m ?? preset?.fallbackHumidityPct ?? 56),
        weatherCode: Number(data?.current?.weather_code ?? 2),
        daily: parsedDaily.length > 0 ? parsedDaily : DEFAULT_DAILY,
      });
    } catch {
      if (preset) {
        setWeather({
          city: preset.name,
          tempC: preset.fallbackTempC,
          condition: preset.fallbackCondition,
          windKmh: preset.fallbackWindKmh,
          precipPct: preset.fallbackPrecipPct,
          humidityPct: preset.fallbackHumidityPct,
          weatherCode: 2,
          daily: DEFAULT_DAILY,
        });
      }
    }
  }, []);

  useEffect(() => {
    const preset = CITY_PRESETS[cityIndex];
    void fetchCityWeather(preset.lat, preset.lon, preset.name, preset);
  }, [cityIndex, fetchCityWeather]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await fetchCityWeather(pos.coords.latitude, pos.coords.longitude, 'Local Sky');
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 6000 }
    );
  };

  const formatTemp = (celsius: number) =>
    unit === 'C' ? celsius : Math.round((celsius * 9) / 5 + 32);

  return (
    <LiquidGlassCard
      strong
      interactive
      className="flex h-full flex-col justify-between px-6 py-7 text-center select-none sm:px-7 sm:py-8"
    >
      {/* Top City Switcher + Live GPS + C/F Unit Toggle */}
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleUseMyLocation}
            title="Use current GPS location"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white/90 transition-colors hover:bg-white/22"
          >
            <LocateFixed className={`h-3.5 w-3.5 ${locating ? 'animate-pulse' : ''}`} />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous city"
              onClick={() =>
                setCityIndex((prev) => (prev - 1 + CITY_PRESETS.length) % CITY_PRESETS.length)
              }
              className="rounded-full p-1 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <AnimatePresence mode="wait">
              <motion.h2
                key={weather.city}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={APPLE_SPRING}
                className="optical-text-shadow font-display text-2xl font-bold tracking-[-0.02em] text-white"
              >
                {weather.city}
              </motion.h2>
            </AnimatePresence>
            <button
              type="button"
              aria-label="Next city"
              onClick={() => setCityIndex((prev) => (prev + 1) % CITY_PRESETS.length)}
              className="rounded-full p-1 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
            className="rounded-full border border-white/35 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white transition-colors hover:bg-white/22"
          >
            °{unit}
          </button>
        </div>

        <p className="optical-text-shadow mt-0.5 text-[15px] font-medium text-white/95">Today</p>
      </div>

      {/* Center Frosted 3D Cloud & Sun + Live Temperature */}
      <div className="my-3">
        <motion.div
          animate={{ y: [-2, 3, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FrostedSunCloudArtwork />
        </motion.div>

        <div className="optical-text-shadow mt-1 font-display text-[56px] leading-none font-bold tracking-[-0.04em] text-white tabular-nums">
          {formatTemp(weather.tempC)}°
        </div>
        <p className="optical-text-shadow mt-2 text-base font-medium text-white/95">
          {weather.condition}
        </p>
      </div>

      {/* Bottom 3-Column Telemetry (Wind km/h • Precip % • Humidity %) + Expandable 4-Day Forecast */}
      <div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {/* 1. Wind */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 28 24" fill="none" className="h-6 w-7 text-white/95" aria-hidden="true">
              <path
                d="M4 9.5h13.5a2.5 2.5 0 1 0-2.4-3.2M2 14h18.5a2.5 2.5 0 1 1-2.4 3.2M6 18.5h6.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="optical-text-shadow mt-1.5 text-[13.5px] font-medium text-white tabular-nums">
              {weather.windKmh} km/h
            </span>
          </div>

          {/* 2. Precipitation */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 28 26" fill="none" className="h-6 w-7" aria-hidden="true">
              <path
                d="M8.2 17.5h11.6a4.2 4.2 0 0 0 .6-8.35A5.8 5.8 0 0 0 9.1 7.6a4.6 4.6 0 0 0-.9 9.9Z"
                fill="rgba(226,232,240,0.92)"
              />
              <path
                d="M10.5 20.2l-1 2.4M14.5 20.2l-1 2.4M18.5 20.2l-1 2.4"
                stroke="#60A5FA"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="optical-text-shadow mt-1.5 text-[13.5px] font-medium text-white tabular-nums">
              {weather.precipPct}%
            </span>
          </div>

          {/* 3. Humidity Droplet */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 24 26" fill="none" className="h-6 w-6" aria-hidden="true">
              <defs>
                <linearGradient id="waterDropGrad" x1="6" y1="3" x2="18" y2="23" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <path
                d="M12 3C12 3 5.5 10.8 5.5 15.8a6.5 6.5 0 0 0 13 0C18.5 10.8 12 3 12 3Z"
                fill="url(#waterDropGrad)"
              />
              <path
                d="M9.3 15.5c0-2 1.2-4.2 2.1-5.6"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="optical-text-shadow mt-1.5 text-[13.5px] font-medium text-white tabular-nums">
              {weather.humidityPct}%
            </span>
          </div>
        </div>

        {/* Interactive 4-Day Forecast Toggle */}
        <div className="mt-4 border-t border-white/22 pt-3">
          <button
            type="button"
            onClick={() => setShowForecast((v) => !v)}
            className="text-[11.5px] font-semibold text-white/85 transition-colors hover:text-white"
          >
            {showForecast ? 'Hide 4-Day Forecast' : 'View 4-Day Forecast'}
          </button>

          <AnimatePresence initial={false}>
            {showForecast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={APPLE_SPRING}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-xs tabular-nums">
                  {weather.daily.map((d) => (
                    <div
                      key={d.dayLabel}
                      className="rounded-2xl border border-white/30 bg-indigo-950/30 py-2"
                    >
                      <p className="font-semibold text-cyan-200">{d.dayLabel}</p>
                      <p className="mt-1 font-bold text-white">
                        {formatTemp(d.maxC)}°{' '}
                        <span className="font-normal text-white/65">{formatTemp(d.minC)}°</span>
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LiquidGlassCard>
  );
}
