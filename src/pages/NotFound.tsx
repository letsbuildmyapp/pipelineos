import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-6 bg-bg">
      <div className="max-w-md text-center">
        <p className="label mb-4">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">This page slipped through the cracks.</h1>
        <p className="text-fg-muted mt-3">The URL doesn't match anything in PipelineOS. It might have moved, or the link is stale.</p>
        <Link to="/app/pipeline" className="btn-primary mt-8">Back to pipeline</Link>
      </div>
    </div>
  );
}

export function ServerError() {
  return (
    <div className="min-h-screen grid place-items-center px-6 bg-bg">
      <div className="max-w-md text-center">
        <p className="label mb-4 text-danger">500</p>
        <h1 className="text-3xl font-semibold tracking-tight">Something broke on our end.</h1>
        <p className="text-fg-muted mt-3">A working demo shouldn't get here. Reload the page — your local data is safe.</p>
        <button onClick={() => location.reload()} className="btn-primary mt-8">Reload</button>
      </div>
    </div>
  );
}
