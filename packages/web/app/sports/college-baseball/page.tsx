import SportPage, { generateMetadata as generateSportMetadata, revalidate } from '../[sport]/page';

export { revalidate };

export const generateMetadata = () => generateSportMetadata({ params: { sport: 'college-baseball' } });

export default function CollegeBaseballPage() {
  return <SportPage params={{ sport: 'college-baseball' }} />;
}
