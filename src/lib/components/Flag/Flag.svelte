<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements';

  interface Props {
    lang: string;
  }

  let { lang, ...restProps }: Props & SvelteHTMLElements['img'] = $props();
  const overrides: Record<string, string> = {
    en: 'us',
  };

  const langCode = Object.keys(overrides).includes(lang) ? overrides[lang] : lang;
</script>

{#if langCode}
  <img
    src="https://flagcdn.com/{langCode}.svg"
    alt={lang}
    class="size-6 object-contain object-center"
    {...restProps}
  />
{/if}
