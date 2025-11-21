import SportPage, { generateMetadata as generateSportMetadata, revalidate } from '../[sport]/page';

export { revalidate };

export const generateMetadata = () => generateSportMetadata({ params: { sport: 'nfl' } });

export default function NFLPage() {
  return <SportPage params={{ sport: 'nfl' }} />;
}
