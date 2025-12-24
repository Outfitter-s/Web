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
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Dialog from '$lib/components/ui/dialog';
  import { InputOTP } from '$lib/components/ui/input-otp';
  import { resolve } from '$app/paths';
  import * as Form from '$lib/components/ui/form';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import { formSchema } from './schema';

  let { data }: PageProps = $props();
  // svelte-ignore state_referenced_locally
  const form = superForm(data.form, {
    validators: zod4Client(formSchema),
    resetForm: false,
    onUpdated: ({ form }) => {
      console.log(form);
      if (form.message) {
        if (form.message?.noTOTPCode === true) {
          totpModalOpen = true;
        } else if (form.message?.mustUsePasskey) {
          loginWithPasskey();
        }
      }
    },
  });
  const { form: formData, enhance, submitting } = form;
  let passkeyLoading = $state(false);
  let totpModalOpen = $state(false);

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
  $inspect($formData);
</script>

<SEO title="seo.auth.logIn.title" description="seo.auth.logIn.description" />

<FormWrapper>
  <div class="flex w-full flex-col space-y-8">
    <form action="?/logIn" method="POST" use:enhance class="flex w-full flex-col space-y-8">
      <img src="/logo.png" class="size-8 object-contain" alt="" />
      <h1 class="mb-2 text-2xl font-semibold">{i18n.t('auth.logIn.title')}</h1>
      <p class="text-muted-foreground text-base">
        {i18n.t('auth.logIn.dontHaveAnAccount.text')}
        <a href={resolve('/auth/sign-up')} class="text-primary font-medium"
          >{i18n.t('auth.logIn.dontHaveAnAccount.cta')}</a
        >
      </p>
      <Form.Field {form} name="username">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{i18n.t('auth.username')}</Form.Label>
            <Input {...props} bind:value={$formData.username} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <Form.Field {form} name="password">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{i18n.t('auth.password')}</Form.Label>
            <Input type="password" {...props} bind:value={$formData.password} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <div class="flex flex-row items-center justify-between">
        <Form.Field {form} name="rememberMe" class="flex flex-row items-center gap-1">
          <Form.Control>
            {#snippet children({ props })}
              <Checkbox {...props} bind:checked={$formData.rememberMe} />
              <Form.Label>{i18n.t('auth.rememberMe')}</Form.Label>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
        <a href={resolve('/auth/forgot-password')} class="text-primary text-sm font-medium"
          >{i18n.t('auth.forgotPasswordKeyword')}</a
        >
      </div>

      <Dialog.Root
        usePortal={false}
        bind:open={totpModalOpen}
        dismissible={false}
        noBackdropClose={true}
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{i18n.t('auth.totp.logIn.title')}</Dialog.Title>
            <Dialog.Description>{i18n.t('auth.totp.logIn.description')}</Dialog.Description>
          </Dialog.Header>

          <Form.Field {form} name="totp">
            <Form.Control>
              {#snippet children({ props })}
                <InputOTP
                  {...props}
                  bind:value={$formData.totp}
                  class={{ container: 'mx-auto w-fit' }}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors class="text-center" />
          </Form.Field>

          <Dialog.Footer>
            <Button type="submit" loading={$submitting}>
              {i18n.t('auth.totp.logIn.nextButton')}
              <ArrowRight class="size-4" />
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

      <Form.Button loading={$submitting}>{i18n.t('auth.submit')}</Form.Button>
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
