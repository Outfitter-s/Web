<script lang="ts">
  import { SEO } from '$lib/components';
  import { Button } from '$lib/components/ui/button';
  import { Toaster } from '$lib/components/Toast/toast';
  import i18n from '$lib/i18n';
  import { logger } from '$lib/utils/logger';
  import FormWrapper from '../formWrapper.svelte';
  import { startAuthentication } from '@simplewebauthn/browser';
  import type { PageProps } from './$types';
  import { ArrowRight, KeyRound } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { enhance } from '$app/forms';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { InputOTP } from '$lib/components/ui/input-otp';
  import { resolve } from '$app/paths';

  let { form }: PageProps = $props();
  let loading = $state(false);
  let passkeyLoading = $state(false);
  let totpModalOpen = $state(false);
  let formData = $state<FormData>(new FormData());

  $effect(() => {
    if (form?.error && form?.action === 'logIn') {
      if (form?.noTOTPCode) {
        totpModalOpen = true;
        return;
      }
      if (form?.mustUsePasskey) {
        loginWithPasskey();
        return;
      }
      if (form?.message) {
        logger.error('Log in error:', form.message);
        Toaster.error(form.message as any);
      }
    }
  });

  async function loginWithPasskey() {
    passkeyLoading = true;
    try {
      const optsRes = await fetch('/api/auth/generate-authentication-options');
      const { opts, UUID } = await optsRes.json();
      const authResp = await startAuthentication(opts);

      const verificationRes = await fetch('/api/auth/verify-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authResp, UUID }),
      });
      const verification = await verificationRes.json();
      if (!verificationRes.ok) {
        throw new Error(verification.error || 'errors.auth.verificationFailed');
      }

      if (verification.verified) {
        window.location.href = '/app';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(errorMessage);
      Toaster.error(errorMessage as any);
    } finally {
      passkeyLoading = false;
    }
  }
</script>

<SEO title="seo.auth.logIn.title" description="seo.auth.logIn.description" />

<Dialog.Root bind:open={totpModalOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{i18n.t('auth.totp.logIn.title')}</Dialog.Title>
      <Dialog.Description>{i18n.t('auth.totp.logIn.description')}</Dialog.Description>
    </Dialog.Header>

    <form
      action="?/logIn"
      class="mt-6 flex flex-col gap-4"
      method="POST"
      use:enhance={(e) => {
        for (const [key, value] of formData.entries()) {
          e.formData.append(key, value);
        }
        loading = true;
        return async ({ update }) => {
          loading = false;
          update({ reset: false });
        };
      }}
    >
      <InputOTP name="totp" class={{ container: 'mx-auto w-fit' }} />
      <Dialog.Footer>
        <Button {loading}>
          {i18n.t('auth.totp.logIn.nextButton')}
          <ArrowRight class="size-4" />
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<FormWrapper>
  <div class="flex w-full flex-col space-y-8">
    <form
      action="?/logIn"
      method="POST"
      use:enhance={(e) => {
        loading = true;
        formData = e.formData;
        return async ({ update }) => {
          await update({ reset: false });
          loading = false;
        };
      }}
      class="flex w-full flex-col space-y-8"
    >
      <img src="/logo.png" class="size-8 object-contain" alt="" />
      <h1 class="mb-2 text-2xl font-semibold">{i18n.t('auth.logIn.title')}</h1>
      <p class="text-muted-foreground text-base">
        {i18n.t('auth.logIn.dontHaveAnAccount.text')}
        <a href={resolve('/auth/sign-up')} class="text-primary font-medium"
          >{i18n.t('auth.logIn.dontHaveAnAccount.cta')}</a
        >
      </p>
      <div class="space-y-2">
        <Label for="username">{i18n.t('auth.username')}</Label>
        <Input name="username" />
      </div>
      <div class="space-y-2">
        <Label>{i18n.t('auth.password')}</Label>
        <Input name="password" type="password" />
      </div>
      <div class="flex flex-row items-center justify-between">
        <div class="flex flex-row items-center gap-1">
          <Checkbox id="rememberMe" name="rememberMe" checked />
          <Label for="rememberMe">{i18n.t('auth.rememberMe')}</Label>
        </div>
        <a href={resolve('/auth/forgot-password')} class="text-primary text-sm font-medium"
          >{i18n.t('auth.forgotPasswordKeyword')}</a
        >
      </div>
      <Button type="submit" {loading}>{i18n.t('auth.submit')}</Button>
    </form>

    <div class="flex flex-row items-center gap-2">
      <div class="border-border w-full border-t"></div>
      <span class="font-mono text-base font-semibold uppercase"
        >{i18n.t('auth.passkey.separator')}</span
      >
      <div class="border-border w-full border-t"></div>
    </div>

    <Button onclick={loginWithPasskey} class="gap-2" loading={passkeyLoading}>
      <KeyRound class="size-4" />
      {i18n.t('auth.passkey.button')}
    </Button>
  </div>
</FormWrapper>
