import { auth } from '@clerk/nextjs/server';

export default async function HealthcheckAuthPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const res = await fetch(`${process.env.BE_DEV_BASE_URL}/healthcheck-auth`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();

  return (
    <div className="p-8 font-mono">
      <pre className="p-4 rounded-lg text-sm whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
