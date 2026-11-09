"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div role="alert" style={{ padding: "100px 24px", textAlign: "center" }}><h1>We could not load this page</h1><p>Please check your connection and try again.</p><button onClick={reset}>Try again</button></div>;
}
