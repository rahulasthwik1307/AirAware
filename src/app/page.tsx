import { AirAwareShell } from '@/components/shell/AirAwareShell';
import { AirQualityProvider } from '@/hooks/aqi/useAirQuality';

export default function Home() {
  return (
    <AirQualityProvider>
      <AirAwareShell />
    </AirQualityProvider>
  );
}
