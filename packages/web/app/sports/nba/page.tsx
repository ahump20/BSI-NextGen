import SportPage, { generateMetadata as generateSportMetadata, revalidate } from '../[sport]/page';

export { revalidate };

export const generateMetadata = () => generateSportMetadata({ params: { sport: 'nba' } });

export default function NBAPage() {
  return <SportPage params={{ sport: 'nba' }} />;
}
