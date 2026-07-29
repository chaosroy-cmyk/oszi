// Wird durch die Text-Rule in wrangler.toml als String eingebunden.
declare module "*.html" {
  const content: string;
  export default content;
}
