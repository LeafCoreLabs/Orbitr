"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LocateFixed, MapPin } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { APPLE_SPRING } from "@/lib/motion";

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
    name: "Toronto",
    lat: 43.6532,
    lon: -79.3832,
    fallbackTempC: 2,
    fallbackWindKmh: 11,
    fallbackPrecipPct: 5,
    fallbackHumidityPct: 48,
    fallbackCondition: "Clear Sky",
  },
  {
    name: "New York",
    lat: 40.7128,
    lon: -74.006,
    fallbackTempC: 7,
    fallbackWindKmh: 9,
    fallbackPrecipPct: 15,
    fallbackHumidityPct: 52,
    fallbackCondition: "Partly Cloudy",
  },
  {
    name: "London",
    lat: 51.5072,
    lon: -0.1276,
    fallbackTempC: 9,
    fallbackWindKmh: 14,
    fallbackPrecipPct: 40,
    fallbackHumidityPct: 68,
    fallbackCondition: "Scattered Clouds",
  },
  {
    name: "Tokyo",
    lat: 35.6762,
    lon: 139.6503,
    fallbackTempC: 14,
    fallbackWindKmh: 7,
    fallbackPrecipPct: 10,
    fallbackHumidityPct: 49,
    fallbackCondition: "Mainly Clear",
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
  isDay: boolean;
  daily: DailyForecastRow[];
}

function decodeWmoCondition(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Atmospheric Mist";
  if (code >= 51 && code <= 67) return "Light Rain";
  if (code >= 71 && code <= 77) return "Snow Flurries";
  if (code >= 80 && code <= 82) return "Passing Showers";
  if (code >= 85 && code <= 86) return "Snow Showers";
  if (code >= 95) return "Thunderstorm";
  return "Partly Cloudy";
}

const DEFAULT_DAILY: DailyForecastRow[] = [
  { dayLabel: "Thu", maxC: 6, minC: 1, precipPct: 10 },
  { dayLabel: "Fri", maxC: 8, minC: 2, precipPct: 20 },
  { dayLabel: "Sat", maxC: 5, minC: 0, precipPct: 35 },
  { dayLabel: "Sun", maxC: 7, minC: 1, precipPct: 10 },
];

function DynamicWeatherArtwork({ code, isDay }: { code: number; isDay: boolean }) {
  const isClear = code === 0 || code === 1;
  const isOvercast = code === 3 || code === 45 || code === 48;
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82);
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  const isStorm = code >= 95;

  return (
    <svg
      viewBox="0 0 200 135"
      fill="none"
      className="mx-auto h-28 w-40 drop-shadow-[0_14px_24px_rgba(0,0,0,0.28)] select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sunSphere" x1="80" y1="18" x2="150" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="moonSphere" x1="80" y1="20" x2="140" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="rearCloudGrad" x1="65" y1="30" x2="155" y2="102" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="frontCloudGrad" x1="42" y1="58" x2="122" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>

      {/* Clear Sky: Sun or Moon */}
      {isClear && isDay && <circle cx="100" cy="64" r="32" fill="url(#sunSphere)" />}
      {isClear && !isDay && (
        <path
          d="M114 34C95 36 80 52 80 71C80 91 96 107 116 107C123 107 130 105 135 101C121 98 111 86 111 71C111 56 121 43 135 40C129 36 122 34 114 34Z"
          fill="url(#moonSphere)"
        />
      )}

      {/* Partly Cloudy: Sun/Moon behind clouds */}
      {!isClear && !isOvercast && !isRain && !isSnow && !isStorm && (
        <circle cx="136" cy="46" r="26" fill={isDay ? "url(#sunSphere)" : "url(#moonSphere)"} />
      )}

      {/* Clouds (shown for all non-clear conditions) */}
      {!isClear && (
        <>
          <path
            d="M66 96H142C154.7 96 165 85.7 165 73C165 61.2 156.1 51.5 144.6 50.2C140.4 36.2 127.4 26 112 26C93.8 26 78.9 40.3 78.1 58.3C67.4 60.2 59.2 69.5 59.2 80.8C59.2 89.2 62.2 96 66 96Z"
            fill="url(#rearCloudGrad)"
          />
          <path
            d="M52 112H112C121.9 112 130 103.9 130 94C130 84.8 123.1 77.2 114.1 76.1C110.8 65.2 100.7 57.2 88.6 57.2C74.4 57.2 62.8 68.3 62.1 82.4C53.7 83.9 47.4 91.2 47.4 100C47.4 106.6 49.4 112 52 112Z"
            fill="url(#frontCloudGrad)"
          />
        </>
      )}

      {/* Raindrops */}
      {(isRain || isStorm) && (
        <g stroke="#93C5FD" strokeWidth="3" strokeLinecap="round">
          <line x1="76" y1="117" x2="72" y2="127" />
          <line x1="96" y1="117" x2="92" y2="127" />
          <line x1="116" y1="117" x2="112" y2="127" />
        </g>
      )}

      {/* Snowflakes */}
      {isSnow && (
        <g fill="#E2E8F0">
          <circle cx="76" cy="122" r="2.8" />
          <circle cx="96" cy="125" r="2.8" />
          <circle cx="116" cy="121" r="2.8" />
        </g>
      )}

      {/* Lightning */}
      {isStorm && (
        <path
          d="M104 96L93 114H103L97 128L113 108H102L104 96Z"
          fill="#FDE047"
        />
      )}
    </svg>
  );
}

export function LiveWeatherGlassCard() {
  const [cityIndex, setCityIndex] = useState(0);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [showForecast, setShowForecast] = useState(false);
  const [locating, setLocating] = useState(false);
  const [usingGps, setUsingGps] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const initialPreset = CITY_PRESETS[0];
  const [weather, setWeather] = useState<WeatherSnapshot>({
    city: initialPreset.name,
    tempC: initialPreset.fallbackTempC,
    condition: initialPreset.fallbackCondition,
    windKmh: initialPreset.fallbackWindKmh,
    precipPct: initialPreset.fallbackPrecipPct,
    humidityPct: initialPreset.fallbackHumidityPct,
    weatherCode: 0,
    isDay: true,
    daily: DEFAULT_DAILY,
  });

  const resolveCityName = async (lat: number, lon: number): Promise<string> => {
    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (geoRes.ok) {
        const geo = await geoRes.json();
        return geo.city || geo.locality || geo.principalSubdivision || "Your Location";
      }
    } catch {
      // Fallback below
    }
    return "Your Location";
  };

  const fetchCityWeather = useCallback(
    async (lat: number, lon: number, label: string, preset?: CityPreset) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather fetch failed");
        const data = await res.json();

        const dailyTimes: string[] = data?.daily?.time ?? [];
        const dailyMax: number[] = data?.daily?.temperature_2m_max ?? [];
        const dailyMin: number[] = data?.daily?.temperature_2m_min ?? [];
        const dailyPrecip: number[] = data?.daily?.precipitation_probability_max ?? [];

        const parsedDaily: DailyForecastRow[] = dailyTimes.slice(1, 5).map((iso, i) => {
          const d = new Date(`${iso}T12:00:00`);
          const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
          return {
            dayLabel,
            maxC: Math.round(dailyMax[i + 1] ?? 10),
            minC: Math.round(dailyMin[i + 1] ?? 4),
            precipPct: Math.round(dailyPrecip[i + 1] ?? 15),
          };
        });

        const code = Number(data?.current?.weather_code ?? 0);
        setWeather({
          city: label,
          tempC: Math.round(data?.current?.temperature_2m ?? preset?.fallbackTempC ?? 10),
          condition: decodeWmoCondition(code),
          windKmh: Math.max(
            1,
            Math.round(data?.current?.wind_speed_10m ?? preset?.fallbackWindKmh ?? 5)
          ),
          precipPct: Math.round(dailyPrecip[0] ?? preset?.fallbackPrecipPct ?? 10),
          humidityPct: Math.round(
            data?.current?.relative_humidity_2m ?? preset?.fallbackHumidityPct ?? 50
          ),
          weatherCode: code,
          isDay: data?.current?.is_day !== 0,
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
            weatherCode: 0,
            isDay: true,
            daily: DEFAULT_DAILY,
          });
        }
      }
    },
    []
  );

  const requestUserLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const cityName = await resolveCityName(latitude, longitude);
        await fetchCityWeather(latitude, longitude, cityName);
        setUsingGps(true);
        setLocating(false);
      },
      () => {
        setLocationDenied(true);
        setUsingGps(false);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [fetchCityWeather]);

  // Ask for user location automatically on mount, and load preset fallback immediately
  useEffect(() => {
    const preset = CITY_PRESETS[cityIndex];
    if (!usingGps) {
      void fetchCityWeather(preset.lat, preset.lon, preset.name, preset);
    }
  }, [cityIndex, fetchCityWeather, usingGps]);

  useEffect(() => {
    requestUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTemp = (celsius: number) =>
    unit === "C" ? celsius : Math.round((celsius * 9) / 5 + 32);

  return (
    <LiquidGlassCard
      strong
      interactive
      className="flex h-full flex-col justify-between px-6 py-7 text-center select-none sm:px-7 sm:py-8"
    >
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={requestUserLocation}
            title={usingGps ? "Live GPS location active (refresh)" : "Allow location for local weather"}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
              usingGps
                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-300"
                : "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`} />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous city"
              onClick={() => {
                setUsingGps(false);
                setCityIndex((prev) => (prev - 1 + CITY_PRESETS.length) % CITY_PRESETS.length);
              }}
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
                className="optical-text-shadow max-w-[140px] truncate font-display text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl"
              >
                {weather.city}
              </motion.h2>
            </AnimatePresence>
            <button
              type="button"
              aria-label="Next city"
              onClick={() => {
                setUsingGps(false);
                setCityIndex((prev) => (prev + 1) % CITY_PRESETS.length);
              }}
              className="rounded-full p-1 text-white/75 transition-colors hover:bg-white/15 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setUnit((u) => (u === "C" ? "F" : "C"))}
            className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white transition-colors hover:bg-white/20"
          >
            °{unit}
          </button>
        </div>

        <div className="mt-1 flex items-center justify-center gap-1.5">
          <p className="optical-text-shadow text-[13px] font-medium text-slate-200">
            {locating ? "Detecting location..." : usingGps ? "Live GPS" : "Today"}
          </p>
          {locationDenied && !usingGps && (
            <button
              type="button"
              onClick={requestUserLocation}
              className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200 hover:bg-white/20"
            >
              <MapPin className="h-2.5 w-2.5" />
              <span>Use GPS</span>
            </button>
          )}
        </div>
      </div>

      <div className="my-3">
        <motion.div
          animate={{ y: [-2, 3, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <DynamicWeatherArtwork code={weather.weatherCode} isDay={weather.isDay} />
        </motion.div>

        <div className="optical-text-shadow mt-1 font-display text-[56px] leading-none font-bold tracking-[-0.04em] text-white tabular-nums">
          {formatTemp(weather.tempC)}°
        </div>
        <p className="optical-text-shadow mt-2 text-base font-medium text-white/95">
          {weather.condition}
        </p>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-2 pt-2">
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

        <div className="mt-4 border-t border-white/20 pt-3">
          <button
            type="button"
            onClick={() => setShowForecast((v) => !v)}
            className="text-[11.5px] font-semibold text-slate-200 transition-colors hover:text-white"
          >
            {showForecast ? "Hide 4-Day Forecast" : "View 4-Day Forecast"}
          </button>

          <AnimatePresence initial={false}>
            {showForecast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={APPLE_SPRING}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-xs tabular-nums">
                  {weather.daily.map((d) => (
                    <div
                      key={d.dayLabel}
                      className="rounded-2xl border border-white/20 bg-white/[0.06] py-2"
                    >
                      <p className="font-semibold text-slate-200">{d.dayLabel}</p>
                      <p className="mt-1 font-bold text-white">
                        {formatTemp(d.maxC)}°{" "}
                        <span className="font-normal text-slate-400">{formatTemp(d.minC)}°</span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-300">{d.precipPct}%</p>
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
