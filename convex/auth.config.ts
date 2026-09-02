export default {
  providers: [
    {
      // Set automatically by the Convex deployment itself -- do not set this
      // one by hand. See MERGE-NOTES.md for the env vars Ankit does need to set.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
