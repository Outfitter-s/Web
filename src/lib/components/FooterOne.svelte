<script>
  const links = [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'About Us',
      href: '#about',
    },
    {
      title: 'Features',
      href: '#features',
    },
    {
      title: 'CGV & CGU',
      href: '#',
    },
  ];
</script>

<footer class="py-16 md:py-32">
  <hr class="border-border" />
  <div class="mx-auto max-w-5xl px-6">
    <div class="my-8 flex flex-wrap justify-center gap-6 text-sm">
      {#each links as link}
        <a href={link.href} class="text-muted-foreground hover:text-primary block duration-150">
          <span>{link.title}</span>
        </a>
      {/each}
    </div>
    <span class="text-muted-foreground block text-center text-sm">
      © {new Date().getFullYear()} Outfiter, All rights reserved</span
    >
    <span class="text-muted-foreground block text-center text-sm mt-2"> Made with ❤️</span>
  </div>
</footer>
