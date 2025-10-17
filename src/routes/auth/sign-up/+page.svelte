<script lang="ts">
  import { enhance } from '$app/forms';
  import { SEO } from '$lib/components';
  import { Toaster } from '$lib/components/Toast/toast';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { t } from '$lib/i18n';
  import { logger } from '$lib/utils/logger';
  import FormWrapper from '../formWrapper.svelte';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
  let loading = $state(false);

  $effect(() => {
    if (form?.error && form?.action === 'signUp') {
      logger.error('Sig-up error:', form.message);
      Toaster.error(form.message);
    }
  });
</script>

<SEO title={$t('seo.auth.signUp.title')} />

<FormWrapper>
  <form
    action="?/signUp"
    method="POST"
    class="flex w-full flex-col space-y-8"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update({ reset: false });
        loading = false;
      };
    }}
  >
    <img src="/logo.png" class="size-8 object-contain" alt="" />
    <h1 class="mb-2 text-2xl font-semibold">{$t('auth.signIn.title')}</h1>
    <p class="text-muted-foreground text-base">
      {$t('auth.signIn.alreadyHaveAnAccount.text')}
      <a href="/auth/log-in" class="text-primary font-medium"
        >{$t('auth.signIn.alreadyHaveAnAccount.cta')}</a
      >
    </p>
    <div class="space-y-2">
      <Label for="email">{$t('auth.email')}</Label>
      <Input name="email" />
    </div>
    <div class="space-y-2">
      <Label for="username">{$t('auth.username')}</Label>
      <Input name="username" />
    </div>
    <div class="space-y-2">
      <Label>{$t('auth.password')}</Label>
      <Input name="password" type="password" />
    </div>
    <div class="flex flex-row items-center justify-between">
      <div class="flex flex-row items-center gap-1">
        <Checkbox id="rememberMe" name="rememberMe" checked />
        <Label for="rememberMe">{$t('auth.rememberMe')}</Label>
      </div>
      <a href="/auth/forgot-password" class="text-primary text-sm font-medium"
        >{$t('auth.forgotPasswordKeyword')}</a
      >
    </div>
    <Button type="submit" {loading}>{$t('auth.submit')}</Button>
  </form>
</FormWrapper>
