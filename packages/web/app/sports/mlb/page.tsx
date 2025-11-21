import SportPage, { generateMetadata as generateSportMetadata, revalidate } from '../[sport]/page';

export { revalidate };

export const generateMetadata = () => generateSportMetadata({ params: { sport: 'mlb' } });

export default function MLBPage() {
  return <SportPage params={{ sport: 'mlb' }} />;
}
