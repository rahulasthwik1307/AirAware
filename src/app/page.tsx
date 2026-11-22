import { AirAwareShell } from '@/components/shell/AirAwareShell';
import { AirQualityProvider } from '@/domain/aqi/useAirQuality';

export default function Home() {
  return (
    <AirQualityProvider>
      <AirAwareShell />
    </AirQualityProvider>
  );
}
