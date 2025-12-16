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
  import Footer from '$lib/components/FooterOne.svelte';

  let data = [
    {
      id: 1,
      title: '1. Add your wardrobe',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      image: '',
      icon: PackageSearch,
    },
    {
      id: 2,
      title: '2. Generate your outfits',
      content:
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      image: '',
      icon: Settings,
    },
    {
      id: 3,
      title: '3. Explore & Share',
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

          <h1 class="mt-8 text-balance text-5xl md:text-7xl lg:mt-16 xl:text-[5.25rem]">
            Weart It, Share It, Own it.
          </h1>
          <p class="mx-auto mt-8 max-w-2xl text-balance text-lg">
            Outfitter is your wardrobe companion. Organize your fashion, get outfit recommendations,
            and connect with a style-driven community. Fashion made effortless.
          </p>

          <div class="mt-12 flex items-center justify-center gap-2 md:flex-row">
            <Button
              size="lg"
              variant="default"
              href="/auth"
              class="group relative overflow-hidden bg-linear-to-r from-primary to-primary/80"
            >
              <span class="relative z-10 flex items-center text-nowrap">
                Find my look
                <ArrowRight
                  class="ml-2 inline-block size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
              <div
                class="absolute inset-0 bg-linear-to-r from-primary/60 via-primary to-primary/40 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-100"
              ></div>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              href="#about"
              class="group relative overflow-hidden border border-primary/30 hover:border-primary/60"
            >
              <span class="relative z-10 transition-colors duration-300 group-hover:text-primary">
                Learn more
              </span>
              <div
                class="absolute inset-0 z-0 bg-primary/5 opacity-0 transition-all duration-500 group-hover:opacity-100"
              ></div>
              <div
                class="absolute -inset-1 -z-20 bg-linear-to-r from-primary/20 to-transparent opacity-0 blur transition-all duration-500 group-hover:opacity-100"
              ></div>
            </Button>
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
      <!-- Badge -->
      <div class="mb-8 flex justify-center">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
        >
          <span class="relative flex size-2">
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"
            ></span>
            <span class="relative inline-flex size-2 rounded-full bg-primary"></span>
          </span>
          About Outfitter
        </div>
      </div>

      <h2
        class="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-center text-4xl font-bold text-white md:text-5xl"
      >
        Who we are?
      </h2>

      <p
        class="mx-auto mt-6 max-w-2xl text-balance text-center text-lg leading-relaxed text-muted-foreground"
      >
        Outfitter was born from an ambitious university project in the 3rd year of a Bachelor's
        degree in Computer Science at Paul Sabatier University in Toulouse. Initiated by a
        passionate team of students, this application reflects our commitment to innovation and
        creating practical solutions to everyday challenges. This academic project has transformed
        into a genuine modern platform, combining technical expertise and creativity to deliver an
        exceptional user experience.
      </p>

      <p
        class="mx-auto mt-6 max-w-2xl text-balance text-center text-lg leading-relaxed text-muted-foreground"
      >
        Outfitter is a cutting-edge web application designed to revolutionize the way you manage and
        style your wardrobe. Our mission is to empower fashion enthusiasts by providing them with
        innovative tools to organize their clothing, discover new outfit ideas, and connect with a
        vibrant community of like-minded individuals.
      </p>
    </div>
  </section>

  <section class="bg-background pb-16 pt-16 md:pb-32">
    <div id="features" class="mx-auto max-w-7xl px-6">
      <!-- Badge -->
      <div class="mb-8 flex justify-center">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
        >
          <span class="relative flex size-2">
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"
            ></span>
            <span class="relative inline-flex size-2 rounded-full bg-primary"></span>
          </span>
          Features
        </div>
      </div>
      <h2
        class="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-center text-4xl font-bold text-white md:text-5xl"
      >
        What we offer?
      </h2>
      <Features {data} />
    </div>
  </section>

  <Footer />
</main>
