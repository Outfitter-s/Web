<script lang="ts">
  import { page } from '$app/state';
  import { SEO } from '$lib/components';
  import Button from '$lib/components/ui/button/button.svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import PackageSearch from '@lucide/svelte/icons/package-search';
  import Settings from '@lucide/svelte/icons/settings';
  import Eye from '@lucide/svelte/icons/eye';
  import IPhone15Pro from '$lib/components/IPhone15Pro.svelte';
  import Features from '$lib/components/Features.svelte';

  let data = [
    {
      id: 1,
      title: '1. blabla',
      content:
        'lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum.',
      image: '',
      icon: PackageSearch,
    },
    {
      id: 2,
      title: '2. blablabl',
      content:
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      image: '',
      icon: Settings,
    },
    {
      id: 3,
      title: '3. blablabla',
      content:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      image: '',
      icon: Eye,
    },
  ];
</script>

<SEO title="seo.homePage.title" description="seo.homePage.description" />

<main class="overflow-hidden">
  <div class="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block">
    <div
      class="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]"
    ></div>
    <div
      class="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]"
    ></div>
    <div
      class="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]"
    ></div>
  </div>
  <section>
    <div class="relative pt-24 md:pt-36">
      <div
        class="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
      ></div>
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center sm:mx-auto lg:mr-auto lg:mt-0">
          {#if page.data.release}
            <a
              href="/"
              class="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 transition-colors duration-300 dark:border-t-white/5"
            >
              <span class="text-foreground text-sm">Introducing Outfitter v{page.data.release}</span
              >
              <span class="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-muted"
              ></span>

              <div
                class="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500"
              >
                <div
                  class="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0"
                >
                  <span class="flex size-6">
                    <ArrowRight class="m-auto size-3" />
                  </span>
                  <span class="flex size-6">
                    <ArrowRight class="m-auto size-3" />
                  </span>
                </div>
              </div>
            </a>
          {/if}

          <h1 class="mt-8 text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
            Style Simplified, Community Amplified
          </h1>
          <p class="mx-auto mt-8 max-w-2xl text-balance text-lg">
            Outfitter is your wardrobe companion. Organize your fashion, get outfit recommendations,
            and connect with a style-driven community. Fashion made effortless.
          </p>

          <div class="mt-12 flex items-center justify-center gap-2 md:flex-row">
            <Button size="lg" variant="default" href="/auth">
              <span class="text-nowrap">Find my look</span>
            </Button>
            <Button size="lg" variant="ghost" href="#about">Learn more</Button>
          </div>
        </div>
      </div>

      <div class="relative mt-8 overflow-visible px-2 sm:mr-0 sm:mt-12 md:mt-20">
        <div class="relative mx-auto flex max-w-6xl justify-center">
          <div class="relative origin-center rotate-15">
            <IPhone15Pro src="/hero.png" scale={0.8} />
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="bg-background pb-16 pt-16 md:pb-32">
    <div id="about" class="mx-auto max-w-7xl px-6">
      <Features {data} />
    </div>
  </section>
</main>
