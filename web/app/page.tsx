import { headers } from 'next/headers';
import Link from 'next/link';
import { App } from '@/components/app/app';
import { getAppConfig } from '@/lib/utils';

export default async function Page() {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);

  return (
    <>
      <Link
        href="/analytics"
        style={{
          position: 'fixed',
          top: 24,
          right: 80,
          zIndex: 100,
          color: '#E63946',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Аналітика
      </Link>
      <App appConfig={appConfig} />
    </>
  );
}
