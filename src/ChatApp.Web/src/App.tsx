import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { appRouter } from './app/router';

export default function App() {
  return (
    <Suspense fallback={<section className="panel">Loading page...</section>}>
      <RouterProvider router={appRouter} />
    </Suspense>
  );
}

