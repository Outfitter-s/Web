<script>
  import i18n from '$lib/i18n';

  let links = $derived([
    [
      {
        title: i18n.t('footer.links.home'),
        href: '/',
      },
      {
        title: i18n.t('footer.links.about'),
        href: '/#about',
      },
      {
        title: i18n.t('footer.links.features'),
        href: '/#features',
      },
      {
        title: 'TOS',
        href: '/legal/terms-of-service',
      },
      {
        title: 'Privacy policy',
        href: '/legal/privacy-policy',
      },
    ],
    [
      {
        title: i18n.t('footer.links.logIn'),
        href: '/auth/log-in',
      },
      {
        title: i18n.t('footer.links.signUp'),
        href: '/auth/sign-up',
      },
    ],
  ]);
</script>

<footer class="pb-16 pt-8 md:pt-16 md:pb-32">
  <hr class="border-border" />
  <div class="mx-auto max-w-5xl px-6">
    {#each links as row}
      <div class="my-8 flex flex-wrap justify-center gap-6 text-sm">
        {#each row as link (link.href)}
          <a href={link.href} class="text-muted-foreground hover:text-primary block duration-150">
            <span>{link.title}</span>
          </a>
        {/each}
      </div>
    {/each}
    <span class="text-muted-foreground block text-center text-sm">
      {i18n.t('footer.rights', { year: new Date().getFullYear() })}
    </span>
    <span class="text-muted-foreground block text-center text-sm mt-2">
      {i18n.t('footer.madeWith')}
    </span>
  </div>
</footer>
