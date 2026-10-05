import NextLink from 'next/link';
import { useRouter } from 'next/router';

export function Link({ to, children, ...props }) {
  const href = typeof to === 'string' && to.startsWith('//') ? `https:${to}` : to;
  return <NextLink href={href} {...props}>{children}</NextLink>;
}

export function useHistory() {
  const router = useRouter();
  return { push: router.push, replace: router.replace, goBack: router.back };
}

export function useLocation() {
  const router = useRouter();
  return { pathname: router.asPath.split('?')[0], state: router.query.from ? { from: { pathname: router.query.from } } : null };
}

export function useParams() {
  const router = useRouter();
  const segments = router.asPath.split('?')[0].split('/').filter(Boolean);
  return { ...router.query, id: router.query.id || (segments[0] === 'book' ? segments[1] : undefined) };
}
