import CleaningApp from '../design/CleaningApp';

export async function getServerSideProps({ resolvedUrl }) {
  return { props: { initialPath: resolvedUrl } };
}

export default function Application({ initialPath }) {
  return <CleaningApp initialPath={initialPath} />;
}
