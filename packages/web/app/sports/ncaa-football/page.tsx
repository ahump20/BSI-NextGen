import SportPage, { generateMetadata as generateSportMetadata, revalidate } from '../[sport]/page';

export { revalidate };

export const generateMetadata = () => generateSportMetadata({ params: { sport: 'ncaa-football' } });

export default function NCAAFootballPage() {
  return <SportPage params={{ sport: 'ncaa-football' }} />;
}
