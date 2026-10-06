import type { GetServerSideProps } from 'next';
import CleaningApp from '../design/CleaningApp';

interface Props { initialPath: string }

// One page renders every route, so the server knows which screen to draw on the first load.
export const getServerSideProps: GetServerSideProps<Props> = async ({ resolvedUrl }) => ({ props: { initialPath: resolvedUrl } });

export default function Application({ initialPath }: Props) {
  return <CleaningApp initialPath={initialPath} />;
}
