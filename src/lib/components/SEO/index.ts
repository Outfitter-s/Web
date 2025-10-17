import { writable } from 'svelte/store';
import SEOComponent from './SEO.svelte';
import config from '$conf';

const SEO = SEOComponent as typeof SEOComponent & {};

export default SEO;

export const pageTitle = writable<string>(config.website.name);
