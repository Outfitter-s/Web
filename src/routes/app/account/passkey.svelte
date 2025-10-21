<script lang="ts">
  import { startRegistration } from '@simplewebauthn/browser';
  import { logger } from '$lib/utils/logger';
  import { Toaster } from '$lib/components/Toast/toast';
  import { enhance } from '$app/forms';
  import { t } from '$lib/i18n';
  import { page } from '$app/state';
  import { ArrowRight } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as AlertDialog from '$lib/components/ui/alert-dialog';

  let removePasskeyModalOpen = $state(false);
  let user = $state(page.data.user);

  $effect(() => {
    if (page?.form && page.form.action === 'deletePasskey') {
      if (page.form.success) {
        user.passkey = null; // Clear passkey from user data
        removePasskeyModalOpen = false; // Close modal if it was open
        Toaster.success('successes.passkeyDeleted');
      } else {
        logger.error(page.form.message);
        Toaster.error(page.form.message);
      }
    }
  });

  async function registerPasskey() {
    const optsRes = await fetch(
      `/api/auth/generate-registration-options?username=${user.username}`
    );
    const opts = await optsRes.json();
    if (!optsRes.ok) {
      logger.error(opts.error);
      Toaster.error(opts.error);
      return;
    }
    try {
      const attResp = await startRegistration(opts);

      const verificationRes = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, attResp }),
      });
      const verification = await verificationRes.json();
      if (!verificationRes.ok) {
        throw new Error(verification.error);
      }

      if (!verification.verified) {
        throw new Error(verification.error);
      }
      logger.debug('Passkey added');
      Toaster.success('successes.passkeyAdded');
      user.passkey = verification.passkey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(errorMessage);
      Toaster.error(errorMessage);
    }
  }
</script>

<AlertDialog.Root bind:open={removePasskeyModalOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{$t('account.tabs.passkey.remove.modal.title')}</AlertDialog.Title>
      <AlertDialog.Description>
        {$t('account.tabs.passkey.remove.modal.description')}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>
        {$t('account.tabs.passkey.remove.modal.cancel')}</AlertDialog.Cancel
      >
      <form action="?/deletePasskey" method="POST" class="w-fit" use:enhance>
        <AlertDialog.Action type="submit">
          {$t('account.tabs.passkey.remove.modal.confirm')}
          <ArrowRight class="size-4" />
        </AlertDialog.Action>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

{#if user.passkey}
  <Button onclick={() => (removePasskeyModalOpen = true)}>
    {$t('account.tabs.passkey.remove.button')}
  </Button>
{:else}
  <Button onclick={registerPasskey}>
    {$t('account.tabs.passkey.register.button')}
  </Button>
{/if}
