export default function NoEngagementPage() {
  return (
    <div className="max-w-md mx-auto mt-12 text-center space-y-4">
      <h1 className="text-lg font-semibold">We can't find your engagement</h1>
      <p className="text-sm text-neutral-600">
        Either we don't have a record of your email yet, or there are multiple
        engagements that need to be sorted out manually. Either way, please
        reach out to Raijuu and we'll fix it.
      </p>
      <p className="text-sm">
        <a className="underline" href="mailto:ramonvallejerajr@gmail.com">
          ramonvallejerajr@gmail.com
        </a>
      </p>
    </div>
  );
}
